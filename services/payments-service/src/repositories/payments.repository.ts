import { getPool, query } from '../config/database';
import { cacheDel, cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';
import { CreateBatchDto, PaymentMethod } from '../types/payments.types';

export const PaymentsRepository = {
  async createBatch(userId: string, dto: CreateBatchDto) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query<{
        business_name: string | null;
        dealer_verified: boolean;
      }>(`SELECT business_name, dealer_verified FROM users WHERE id = $1`, [userId]);
      const user = userRes.rows[0];
      if (!user?.dealer_verified) {
        throw Object.assign(new Error('Dealer not verified'), { code: 'DEALER_NOT_VERIFIED' });
      }

      const seqRes = await client.query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM payment_batches`
      );
      const seq = Number(seqRes.rows[0]?.n || 0) + 1;
      const batchCode = `BATCH-2026-${String(seq).padStart(4, '0')}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const batchRes = await client.query<{
        id: string;
        batch_id: string;
        status: string;
        dealer_verified: boolean;
        expires_at: Date;
      }>(
        `INSERT INTO payment_batches
           (batch_id, user_id, tin, business_registration_no, dealer_business_name,
            dealer_verified, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, TRUE, 'ready', $6)
         RETURNING id, batch_id, status, dealer_verified, expires_at`,
        [batchCode, userId, dto.tin, dto.businessRegistrationNo, user.business_name, expiresAt.toISOString()]
      );
      const batch = batchRes.rows[0];
      const items = [];

      for (const item of dto.items) {
        const deviceRes = await client.query<{
          id: string;
          imei1: string;
          imei2: string | null;
          brand: string | null;
          model_name: string | null;
        }>(
          `SELECT id, imei1, imei2, brand, model_name FROM devices WHERE imei1 = $1 LIMIT 1`,
          [item.imei1]
        );
        const device = deviceRes.rows[0];
        if (!device) {
          throw Object.assign(new Error(`IMEI not found: ${item.imei1}`), { code: 'IMEI_NOT_FOUND' });
        }
        const taxAmount = 925782;
        await client.query(
          `INSERT INTO payment_batch_items
             (batch_id, device_id, imei1, imei2, brand, model_name, tax_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [batch.id, device.id, device.imei1, device.imei2, device.brand, device.model_name, taxAmount]
        );
        items.push({
          deviceId: Number(device.id),
          brand: device.brand,
          modelName: device.model_name,
          imei1: device.imei1,
          imei2: device.imei2,
          taxAmount,
        });
      }

      await client.query('COMMIT');
      return {
        batchId: batch.batch_id,
        status: batch.status,
        dealerVerified: batch.dealer_verified,
        totalTax: items.reduce((s, i) => s + i.taxAmount, 0),
        expiresAt: new Date(batch.expires_at).toISOString(),
        items,
        _id: batch.id,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findBatch(idOrBatchId: string) {
    const { rows } = await query<{
      id: string;
      batch_id: string;
      user_id: string;
      status: string;
      dealer_business_name: string | null;
      tax_application_id: string | null;
    }>(
      `SELECT id, batch_id, user_id, status, dealer_business_name, tax_application_id
       FROM payment_batches
       WHERE id::text = $1 OR batch_id = $1
       LIMIT 1`,
      [idOrBatchId]
    );
    const batch = rows[0];
    if (!batch) return null;
    const itemsRes = await query<{
      device_id: string;
      imei1: string;
      imei2: string | null;
      brand: string | null;
      model_name: string | null;
      tax_amount: number;
    }>(
      `SELECT device_id, imei1, imei2, brand, model_name, tax_amount
       FROM payment_batch_items WHERE batch_id = $1`,
      [batch.id]
    );
    return { ...batch, items: itemsRes.rows };
  },

  async payBatch(batchId: string, method: PaymentMethod) {
    const batch = await this.findBatch(batchId);
    if (!batch) return null;

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const totalAmount = batch.items.reduce((s, i) => s + i.tax_amount, 0);
      const paidAt = new Date();
      const paymentId = `${paidAt.toISOString().replace(/\D/g, '').slice(0, 14)}-1`;
      const first = batch.items[0];

      const payRes = await client.query<{ payment_id: string; gateway_ref: string | null; paid_at: Date }>(
        `INSERT INTO payments
           (payment_id, user_id, device_id, batch_id, tax_application_id, payer_name,
            payment_method, gateway_ref, total_amount, payment_status, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::payment_method, $8, $9, 'success', $10)
         RETURNING payment_id, gateway_ref, paid_at`,
        [
          paymentId,
          batch.user_id,
          first?.device_id ?? null,
          batch.id,
          batch.tax_application_id,
          batch.dealer_business_name,
          method,
          `${method.toUpperCase()}-8f2a`,
          totalAmount,
          paidAt.toISOString(),
        ]
      );

      await client.query(
        `UPDATE payment_batches SET status = 'paid' WHERE id = $1`,
        [batch.id]
      );
      await client.query(
        `UPDATE devices SET tax_payment_status = 'paid'
         WHERE id = ANY($1::bigint[])`,
        [batch.items.map((i) => i.device_id)]
      );
      await client.query(
        `INSERT INTO activities (user_id, type, detail, occurred_at)
         VALUES ($1, 'tax_paid', $2, NOW())`,
        [batch.user_id, `${batch.items.length} Device(s) Paid Tax Successfully`]
      );

      await client.query('COMMIT');
      await cacheDel(`payments:list:${batch.user_id}:1:20`);

      const p = payRes.rows[0];
      return {
        batchId: batch.batch_id,
        status: 'paid',
        paymentId: p.payment_id,
        paymentMethod: method,
        gatewayRef: p.gateway_ref,
        totalAmount,
        paidCount: batch.items.length,
        paidAt: new Date(p.paid_at).toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async listPayments(userId: string, page: number, pageSize: number) {
    const cacheKey = `payments:list:${userId}:${page}:${pageSize}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM payments WHERE user_id = $1`,
      [userId]
    );
    const total = Number(countRes.rows[0]?.count || 0);
    const offset = (page - 1) * pageSize;
    const { rows } = await query<{
      payment_id: string;
      total_amount: number;
      payment_method: string;
      payment_status: string;
      paid_at: Date | null;
      brand: string | null;
      model_name: string | null;
      imei1: string | null;
    }>(
      `SELECT p.payment_id, p.total_amount, p.payment_method, p.payment_status, p.paid_at,
              d.brand, d.model_name, d.imei1
       FROM payments p
       LEFT JOIN devices d ON d.id = p.device_id
       WHERE p.user_id = $1
       ORDER BY p.paid_at DESC NULLS LAST, p.id DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    const data = {
      page,
      pageSize,
      total,
      items: rows.map((p) => ({
        paymentId: p.payment_id,
        totalAmount: p.total_amount,
        paymentMethod: p.payment_method,
        status: p.payment_status,
        paidAt: p.paid_at ? new Date(p.paid_at).toISOString() : null,
        brand: p.brand,
        modelName: p.model_name,
        imei1: p.imei1,
      })),
    };
    await cacheSet(cacheKey, data, 60);
    return data;
  },

  async findPayment(paymentId: string) {
    const { rows } = await query<{
      payment_id: string;
      user_id: string;
      batch_id: string | null;
      payment_status: string;
      payment_method: string;
      gateway_ref: string | null;
      total_amount: number;
      paid_at: Date | null;
      brand: string | null;
      product_name: string | null;
      model_name: string | null;
      serial_number: string | null;
      imei1: string | null;
      imei2: string | null;
      batch_code: string | null;
    }>(
      `SELECT p.payment_id, p.user_id, p.batch_id, p.payment_status, p.payment_method, p.gateway_ref,
              p.total_amount, p.paid_at,
              d.brand, d.product_name, d.model_name, d.serial_number, d.imei1, d.imei2,
              b.batch_id AS batch_code
       FROM payments p
       LEFT JOIN devices d ON d.id = p.device_id
       LEFT JOIN payment_batches b ON b.id = p.batch_id
       WHERE p.payment_id = $1
       LIMIT 1`,
      [paymentId]
    );
    const p = rows[0];
    if (!p) return null;
    return {
      paymentId: p.payment_id,
      userId: p.user_id,
      batchId: p.batch_code,
      status: p.payment_status,
      paymentMethod: p.payment_method,
      gatewayRef: p.gateway_ref,
      totalAmount: p.total_amount,
      paidAt: p.paid_at ? new Date(p.paid_at).toISOString() : null,
      device: {
        brand: p.brand,
        productName: p.product_name,
        modelName: p.model_name,
        serialNumber: p.serial_number,
        imei1: p.imei1,
        imei2: p.imei2,
      },
    };
  },
};

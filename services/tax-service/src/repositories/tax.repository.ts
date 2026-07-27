import { query, getPool } from '../config/database';
import { CreateTaxApplicationDto } from '../types/tax.types';

interface DeviceRow {
  id: string;
  imei1: string;
  imei2: string | null;
  brand: string | null;
  product_name: string | null;
  model_name: string | null;
}

function calcTaxes() {
  const customValue = 90300;
  const customsDuty = 125782;
  const commercialTax = 125782;
  const redemptionFine = 125782;
  return {
    customValue,
    customsDuty,
    commercialTax,
    redemptionFine,
    totalTax: customsDuty + commercialTax + redemptionFine,
  };
}

export const TaxRepository = {
  async create(userId: string, dto: CreateTaxApplicationDto) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const appRes = await client.query<{ id: string; status: string; total_tax: number; expires_at: Date }>(
        `INSERT INTO tax_applications (user_id, status, total_tax, expires_at)
         VALUES ($1, 'calculated', 0, $2)
         RETURNING id, status, total_tax, expires_at`,
        [userId, expiresAt.toISOString()]
      );
      const app = appRes.rows[0];
      const items = [];

      for (const d of dto.devices) {
        const deviceRes = await client.query<DeviceRow>(
          `SELECT id, imei1, imei2, brand, product_name, model_name
           FROM devices WHERE imei1 = $1 LIMIT 1`,
          [d.imei1]
        );
        const device = deviceRes.rows[0];
        if (!device) {
          throw Object.assign(new Error(`IMEI not found: ${d.imei1}`), { code: 'IMEI_NOT_FOUND' });
        }
        const tax = calcTaxes();
        await client.query(
          `INSERT INTO tax_application_items
             (tax_application_id, device_id, custom_value, customs_duty, commercial_tax, redemption_fine, total_tax)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            app.id,
            device.id,
            tax.customValue,
            tax.customsDuty,
            tax.commercialTax,
            tax.redemptionFine,
            tax.totalTax,
          ]
        );
        items.push({
          deviceId: Number(device.id),
          brand: device.brand,
          productName: device.product_name,
          modelName: device.model_name,
          imei1: device.imei1,
          imei2: device.imei2,
          ...tax,
        });
      }

      const totalTax = items.reduce((s, i) => s + i.totalTax, 0);
      await client.query(`UPDATE tax_applications SET total_tax = $1 WHERE id = $2`, [
        totalTax,
        app.id,
      ]);
      await client.query('COMMIT');

      return {
        id: app.id,
        status: 'calculated',
        totalTax,
        expiresAt: new Date(app.expires_at).toISOString(),
        items,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findById(id: string) {
    const appRes = await query<{
      id: string;
      status: string;
      total_tax: number;
      expires_at: Date;
    }>(
      `SELECT id, status, total_tax, expires_at FROM tax_applications WHERE id = $1`,
      [id]
    );
    const app = appRes.rows[0];
    if (!app) return null;

    const itemsRes = await query<{
      device_id: string;
      brand: string | null;
      product_name: string | null;
      model_name: string | null;
      imei1: string;
      imei2: string | null;
      custom_value: number;
      customs_duty: number;
      commercial_tax: number;
      redemption_fine: number;
      total_tax: number;
    }>(
      `SELECT i.device_id, d.brand, d.product_name, d.model_name, d.imei1, d.imei2,
              i.custom_value, i.customs_duty, i.commercial_tax, i.redemption_fine, i.total_tax
       FROM tax_application_items i
       JOIN devices d ON d.id = i.device_id
       WHERE i.tax_application_id = $1
       ORDER BY i.id`,
      [id]
    );

    return {
      id: app.id,
      status: app.status,
      totalTax: app.total_tax,
      expiresAt: new Date(app.expires_at).toISOString(),
      items: itemsRes.rows.map((i) => ({
        deviceId: Number(i.device_id),
        brand: i.brand,
        productName: i.product_name,
        modelName: i.model_name,
        imei1: i.imei1,
        imei2: i.imei2,
        customValue: i.custom_value,
        customsDuty: i.customs_duty,
        commercialTax: i.commercial_tax,
        redemptionFine: i.redemption_fine,
        totalTax: i.total_tax,
      })),
    };
  },
};

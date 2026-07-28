import { getPool, query } from '../config/database';
import { cacheDel } from '../../../../packages/shared/src/redis/client';
import { CreateClaimDto } from '../types/claims.types';

export const ClaimsRepository = {
  async create(userId: string, dto: CreateClaimDto) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const profileRes = await client.query<{
        full_name: string;
        nrc_no: string | null;
        phone: string | null;
        address: string | null;
        township_id: string | null;
      }>(
        `SELECT full_name, nrc_no, phone, address, township_id
         FROM users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      const profile = profileRes.rows[0];
      if (!profile) {
        throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
      }
      if (!profile.nrc_no || !profile.phone) {
        throw Object.assign(new Error('User profile is incomplete for claims'), {
          code: 'VALIDATION_ERROR',
        });
      }

      const deviceRes = await client.query<{
        id: string;
        brand: string | null;
        model_name: string | null;
        imei2: string | null;
      }>(`SELECT id, brand, model_name, imei2 FROM devices WHERE imei1 = $1 LIMIT 1`, [dto.imei1]);
      const device = deviceRes.rows[0];

      const countRes = await client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM device_claims`);
      const claimCode = `CLAIM-2026-${String(Number(countRes.rows[0]?.n || 0) + 1).padStart(4, '0')}`;

      const claimRes = await client.query<{
        id: string;
        claim_id: string;
        status: string;
        imei1: string;
        imei2: string | null;
        submitted_at: Date;
      }>(
        `INSERT INTO device_claims
           (claim_id, user_id, claimant_full_name, claimant_nrc_number, claimant_phone, address,
            township_id, device_id, imei1, imei2, brand, model_name, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted')
         RETURNING id, claim_id, status, imei1, imei2, submitted_at`,
        [
          claimCode,
          userId,
          profile.full_name,
          profile.nrc_no,
          profile.phone,
          profile.address,
          profile.township_id,
          device?.id ?? null,
          dto.imei1,
          dto.imei2 ?? device?.imei2 ?? null,
          device?.brand ?? 'Unknown',
          device?.model_name ?? 'Unknown',
        ]
      );
      const claim = claimRes.rows[0];
      const photoUrl =
        dto.devicePhotoUrl ||
        dto.devicePhoto ||
        'https://cdn.example/device.jpg';
      const docs = [{ type: 'device_photo' as const, url: photoUrl }];
      for (const d of docs) {
        await client.query(
          `INSERT INTO claim_documents (claim_id, doc_type, file_url)
           VALUES ($1, $2::claim_doc_type, $3)`,
          [claim.id, d.type, d.url]
        );
      }
      await client.query(
        `INSERT INTO activities (user_id, type, detail, occurred_at)
         VALUES ($1, 'device_claimed', 'Device Claimed', NOW())`,
        [userId]
      );
      await client.query('COMMIT');
      await cacheDel(`claims:list:${userId}`, `activities:${userId}:10`);

      return {
        claimId: claim.claim_id,
        status: claim.status,
        imei1: claim.imei1,
        imei2: claim.imei2,
        reason: dto.reason ?? null,
        submittedAt: new Date(claim.submitted_at).toISOString(),
        documents: docs.map((d) => ({ docType: d.type, fileUrl: d.url })),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async list(userId: string) {
    const { rows } = await query<{
      claim_id: string;
      brand: string | null;
      model_name: string | null;
      status: string;
      submitted_at: Date;
    }>(
      `SELECT claim_id, brand, model_name, status, submitted_at
       FROM device_claims
       WHERE user_id = $1
       ORDER BY submitted_at DESC`,
      [userId]
    );
    return {
      items: rows.map((c) => ({
        claimId: c.claim_id,
        title: `${c.brand || ''} ${c.model_name || ''}`.trim(),
        status: c.status,
        submittedAt: new Date(c.submitted_at).toISOString(),
      })),
    };
  },
};

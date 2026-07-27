import { getPool, query } from '../config/database';
import { cacheDel } from '../../../../packages/shared/src/redis/client';
import { CreateClaimDto } from '../types/claims.types';

export const ClaimsRepository = {
  async create(userId: string, dto: CreateClaimDto) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

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
        claimant_full_name: string;
        claimant_nrc_number: string;
        claimant_phone: string;
        address: string | null;
        township_id: string | null;
        imei1: string;
        imei2: string | null;
        submitted_at: Date;
      }>(
        `INSERT INTO device_claims
           (claim_id, user_id, claimant_full_name, claimant_nrc_number, claimant_phone, address,
            township_id, device_id, imei1, imei2, brand, model_name, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted')
         RETURNING id, claim_id, status, claimant_full_name, claimant_nrc_number, claimant_phone,
                   address, township_id, imei1, imei2, submitted_at`,
        [
          claimCode,
          userId,
          dto.fullName,
          dto.nrcNumber,
          dto.phone,
          dto.address,
          dto.townshipId,
          device?.id ?? null,
          dto.imei1,
          dto.imei2 ?? device?.imei2 ?? null,
          device?.brand ?? 'Unknown',
          device?.model_name ?? 'Unknown',
        ]
      );
      const claim = claimRes.rows[0];
      const docs = [
        { type: 'nrc_front', url: dto.nrcFrontUrl || 'https://cdn.example/front.jpg' },
        { type: 'nrc_back', url: dto.nrcBackUrl || 'https://cdn.example/back.jpg' },
        { type: 'device_photo', url: dto.devicePhotoUrl || 'https://cdn.example/device.jpg' },
      ];
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
        fullName: claim.claimant_full_name,
        nrcNumber: claim.claimant_nrc_number,
        phone: claim.claimant_phone,
        address: claim.address,
        townshipId: claim.township_id != null ? Number(claim.township_id) : null,
        imei1: claim.imei1,
        imei2: claim.imei2,
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

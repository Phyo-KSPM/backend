import { query } from '../config/database';
import { cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';

const CACHE_KEY = 'nrc:townships:all';

export const NrcRepository = {
  async listRegionsWithTownships() {
    const cached = await cacheGet<{ regions: unknown[] }>(CACHE_KEY);
    if (cached) return cached;

    const regionsRes = await query<{ id: string; code: string; name: string }>(
      `SELECT id, code, name FROM nrc_regions ORDER BY id`
    );
    const townshipsRes = await query<{
      id: string;
      region_id: string;
      code: string;
      name_en: string;
      name_mm: string;
    }>(`SELECT id, region_id, code, name_en, name_mm FROM nrc_townships ORDER BY id`);

    const data = {
      regions: regionsRes.rows.map((region) => ({
        id: Number(region.id),
        code: region.code,
        name: region.name,
        townships: townshipsRes.rows
          .filter((t) => t.region_id === region.id)
          .map((t) => ({
            id: Number(t.id),
            code: t.code,
            nameEn: t.name_en,
            nameMm: t.name_mm,
          })),
      })),
    };
    await cacheSet(CACHE_KEY, data, 3600);
    return data;
  },
};

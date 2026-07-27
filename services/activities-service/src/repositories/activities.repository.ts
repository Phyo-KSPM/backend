import { query } from '../config/database';
import { cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';

export const ActivitiesRepository = {
  async list(userId: string, limit: number) {
    const cacheKey = `activities:${userId}:${limit}`;
    const cached = await cacheGet<{ items: unknown[] }>(cacheKey);
    if (cached) return cached;

    const { rows } = await query<{
      id: string;
      type: string;
      detail: string;
      occurred_at: Date;
    }>(
      `SELECT id, type, detail, occurred_at
       FROM activities
       WHERE user_id = $1
       ORDER BY occurred_at DESC, id DESC
       LIMIT $2`,
      [userId, limit]
    );

    const data = {
      items: rows.map((a) => ({
        id: Number(a.id),
        type: a.type,
        detail: a.detail,
        occurredAt: new Date(a.occurred_at).toISOString(),
      })),
    };
    await cacheSet(cacheKey, data, 60);
    return data;
  },
};

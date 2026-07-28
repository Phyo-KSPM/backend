import { query } from '../config/database';
import { cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';

interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  nrc_no: string | null;
  address: string | null;
}

interface BindingRow {
  device_fingerprint: string;
  device_name: string | null;
  platform: string;
  app_version: string | null;
  bound_at: Date;
  last_seen_at: Date;
}

function mapUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.full_name,
    nrcNo: u.nrc_no,
    address: u.address,
  };
}

const profileCacheKey = (id: string) => `user:profile:${id}`;

export const UsersRepository = {
  async findById(id: string) {
    const cached = await cacheGet<ReturnType<typeof mapUser>>(profileCacheKey(id));
    if (cached) return cached;

    const { rows } = await query<UserRow>(
      `SELECT id, email, phone, full_name, nrc_no, address
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    const mapped = mapUser(rows[0]);
    await cacheSet(profileCacheKey(id), mapped, 120);
    return mapped;
  },

  async getBinding(userId: string) {
    const { rows } = await query<BindingRow>(
      `SELECT device_fingerprint, device_name, platform, app_version, bound_at, last_seen_at
       FROM user_device_bindings WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const b = rows[0];
    if (!b) return null;
    return {
      deviceId: b.device_fingerprint,
      boundAt: new Date(b.bound_at).toISOString(),
    };
  },
};

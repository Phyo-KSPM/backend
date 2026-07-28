import { query } from '../config/database';
import { cacheDel, cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';
import { DealerVerifyDto } from '../types/users.types';

interface UserRow {
  id: string;
  email: string;
  agent_id: string;
  phone: string | null;
  full_name: string;
  address: string | null;
  township_id: string | null;
  business_name: string | null;
  tin: string | null;
  business_registration_no: string | null;
  dealer_verified: boolean;
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
    agentId: u.agent_id,
    email: u.email,
    phone: u.phone,
    fullName: u.full_name,
    address: u.address,
    townshipId: u.township_id != null ? Number(u.township_id) : null,
    businessName: u.business_name,
    tin: u.tin,
    businessRegistrationNo: u.business_registration_no,
    dealerVerified: u.dealer_verified,
  };
}

const profileCacheKey = (id: string) => `user:profile:${id}`;

export const UsersRepository = {
  async findById(id: string) {
    const cached = await cacheGet<ReturnType<typeof mapUser>>(profileCacheKey(id));
    if (cached) return cached;

    const { rows } = await query<UserRow>(
      `SELECT id, email, agent_id, phone, full_name, address, township_id,
              business_name, tin, business_registration_no, dealer_verified
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
      bound: true,
      deviceFingerprint: b.device_fingerprint,
      deviceName: b.device_name,
      platform: b.platform,
      appVersion: b.app_version,
      boundAt: new Date(b.bound_at).toISOString(),
      lastSeenAt: new Date(b.last_seen_at).toISOString(),
    };
  },

  async verifyDealer(userId: string, dto: DealerVerifyDto) {
    const { rows } = await query<UserRow>(
      `UPDATE users
       SET dealer_verified = TRUE
       WHERE id = $1
         AND business_registration_no = $2
         AND tin = $3
       RETURNING id, email, agent_id, phone, full_name, address, township_id,
                 business_name, tin, business_registration_no, dealer_verified`,
      [userId, dto.businessRegistrationNo, dto.tin]
    );
    if (!rows[0]) return null;
    await cacheDel(profileCacheKey(userId));
    return mapUser(rows[0]);
  },
};

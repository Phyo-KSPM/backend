import { query } from '../config/database';
import { BindingRow, DevicePlatform, PublicUser, UserRow } from '../types/auth.types';

function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
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

export const AuthRepository = {
  async findUserByEmail(email: string): Promise<(UserRow & { public: PublicUser }) | null> {
    const { rows } = await query<UserRow>(
      `SELECT id, email, password_hash, phone, full_name, address, township_id,
              business_name, tin, business_registration_no, dealer_verified
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );
    if (!rows[0]) return null;
    return { ...rows[0], public: toPublicUser(rows[0]) };
  },

  async findUserById(id: string): Promise<PublicUser | null> {
    const { rows } = await query<UserRow>(
      `SELECT id, email, password_hash, phone, full_name, address, township_id,
              business_name, tin, business_registration_no, dealer_verified
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return rows[0] ? toPublicUser(rows[0]) : null;
  },

  async getBinding(userId: string): Promise<BindingRow | null> {
    const { rows } = await query<BindingRow>(
      `SELECT user_id, device_fingerprint, device_name, platform, app_version, bound_at, last_seen_at
       FROM user_device_bindings
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async createBinding(input: {
    userId: string;
    deviceFingerprint: string;
    deviceName: string;
    platform: DevicePlatform;
    appVersion: string;
  }): Promise<BindingRow> {
    const { rows } = await query<BindingRow>(
      `INSERT INTO user_device_bindings
         (user_id, device_fingerprint, device_name, platform, app_version, bound_at, last_seen_at)
       VALUES ($1, $2, $3, $4::device_platform, $5, NOW(), NOW())
       RETURNING user_id, device_fingerprint, device_name, platform, app_version, bound_at, last_seen_at`,
      [input.userId, input.deviceFingerprint, input.deviceName, input.platform, input.appVersion]
    );
    return rows[0];
  },

  async touchBinding(
    userId: string,
    updates: { deviceName?: string; appVersion?: string }
  ): Promise<BindingRow> {
    const { rows } = await query<BindingRow>(
      `UPDATE user_device_bindings
       SET last_seen_at = NOW(),
           device_name = COALESCE($2, device_name),
           app_version = COALESCE($3, app_version)
       WHERE user_id = $1
       RETURNING user_id, device_fingerprint, device_name, platform, app_version, bound_at, last_seen_at`,
      [userId, updates.deviceName ?? null, updates.appVersion ?? null]
    );
    return rows[0];
  },

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt.toISOString()]
    );
  },

  async findRefreshToken(tokenHash: string): Promise<{ user_id: string; expires_at: Date } | null> {
    const { rows } = await query<{ user_id: string; expires_at: Date }>(
      `SELECT user_id, expires_at
       FROM refresh_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] ?? null;
  },

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
  },
};

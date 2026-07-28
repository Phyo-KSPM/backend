import { query } from '../config/database';
import { BindingRow, DevicePlatform, PublicUser, UserRow } from '../types/auth.types';

const USER_COLUMNS = `id, email, agent_id, password_hash, phone, full_name, nrc_no, address,
              township_id, business_name`;

function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.full_name,
    nrcNo: u.nrc_no,
    address: u.address,
  };
}

export type AuthSessionRow = {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_fingerprint: string;
  expires_at: Date;
  revoked_at: Date | null;
};

export const AuthRepository = {
  async findUserByEmail(email: string): Promise<(UserRow & { public: PublicUser }) | null> {
    const { rows } = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email]
    );
    if (!rows[0]) return null;
    return { ...rows[0], public: toPublicUser(rows[0]) };
  },

  async findUserByAgentId(
    agentId: string
  ): Promise<(UserRow & { public: PublicUser }) | null> {
    const { rows } = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE lower(agent_id) = lower($1)
       LIMIT 1`,
      [agentId]
    );
    if (!rows[0]) return null;
    return { ...rows[0], public: toPublicUser(rows[0]) };
  },

  async findUserById(id: string): Promise<PublicUser | null> {
    const { rows } = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
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

  async createSession(input: {
    userId: string;
    sessionTokenHash: string;
    deviceFingerprint: string;
    expiresAt: Date;
  }): Promise<AuthSessionRow> {
    const { rows } = await query<AuthSessionRow>(
      `INSERT INTO auth_sessions
         (user_id, refresh_token_hash, device_fingerprint, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, refresh_token_hash, device_fingerprint, expires_at, revoked_at`,
      [
        input.userId,
        input.sessionTokenHash,
        input.deviceFingerprint,
        input.expiresAt.toISOString(),
      ]
    );
    return rows[0];
  },

  async findActiveSessionById(sessionId: string): Promise<AuthSessionRow | null> {
    const { rows } = await query<AuthSessionRow>(
      `SELECT id, user_id, refresh_token_hash, device_fingerprint, expires_at, revoked_at
       FROM auth_sessions
       WHERE id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [sessionId]
    );
    return rows[0] ?? null;
  },

  async touchSession(sessionId: string): Promise<void> {
    await query(`UPDATE auth_sessions SET last_used_at = NOW() WHERE id = $1`, [
      sessionId,
    ]);
  },

  async revokeSession(sessionId: string): Promise<void> {
    await query(
      `UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId]
    );
  },

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await query(
      `UPDATE auth_sessions SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  },
};

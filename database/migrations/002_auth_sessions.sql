-- Production auth sessions: refresh tokens live in DB; access JWT carries session id (jti).
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
  ON auth_sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
  ON auth_sessions (expires_at)
  WHERE revoked_at IS NULL;

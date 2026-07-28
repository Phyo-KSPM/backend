-- 003_agent_id.sql
-- Unique Agent Account ID for dealer/agent login (email OR agent_id)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agent_id TEXT;

UPDATE users
SET agent_id = 'AGT-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE agent_id IS NULL OR btrim(agent_id) = '';

ALTER TABLE users
  ALTER COLUMN agent_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_agent_id_uidx ON users (agent_id);

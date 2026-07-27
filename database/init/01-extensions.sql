-- CEIR Postgres init (runs once on first container start)
-- Full schema is applied via: npm run db:migrate
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

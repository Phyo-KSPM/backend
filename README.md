# CEIR Backend (Microservices)

CEIR mobile API backend — domain services aligned with the ER diagram and public surface `/openapi/v1`.

**Repository:** https://github.com/Phyo-KSPM/backend.git

## Guides

| File | Purpose |
|------|---------|
| [`project-setup.txt`](./project-setup.txt) | Full prerequisites, step-by-step, PM2, Git clone, troubleshooting |
| [`project-start.txt`](./project-start.txt) | Short quick-start summary |

## Quick start (recommended: PM2)

```bash
git clone https://github.com/Phyo-KSPM/backend.git
cd backend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run docker:infra          # Postgres + Redis
npm run db:setup              # migrate + seed
npm run pm2:start             # all app services
npm run pm2:status
```

Smoke checks:

- http://localhost:3000/health
- http://localhost:3000/openapi/v1/nrc/townships

Demo login: `maung@dealer.com` / `secret123`  
Sample IMEI: `359876543210108`

## Infrastructure

| Component | Port | Notes |
|-----------|------|--------|
| api-gateway | 3000 | Public `/openapi/v1` (+ `/api`) |
| bff | 3002 | Backend-for-frontend |
| PostgreSQL 16 | 5432 | `app_db` — `database/docker-compose.yml` |
| Redis 7 | 6379 | `redis/docker-compose.yml` |

## Domain services

| Service | Port | Tables | Routes |
|---------|------|--------|--------|
| auth-service | 3010 | `users`, `refresh_tokens`, `user_device_bindings` | `/login`, `/auth/refresh`, `/device/*` |
| users-service | 3011 | `users` | `/profile`, `/dealer/verify` |
| devices-service | 3012 | `devices`, `imei_check_logs` | `/imei/check`, `/imei/bulk-check` |
| tax-service | 3013 | `tax_applications`, `tax_application_items` | `/tax/applications` |
| payments-service | 3014 | `payments`, `payment_batches`, `payment_batch_items` | `/payments/*` |
| claims-service | 3015 | `device_claims`, `claim_documents` | `/claims` |
| activities-service | 3016 | `activities` | `/activities` |
| nrc-service | 3017 | `nrc_regions`, `nrc_townships` | `/nrc/townships` |

## Database & cache

- Migrations: `npm run db:migrate` (`database/migrations/`)
- Seeds: `npm run db:seed` (`database/seeds/`)
- Both: `npm run db:setup`
- Parameterized SQL (`$1`, `$2`, …) via `pg`
- Redis cache: profile, IMEI, NRC townships, payments list, activities

## Scripts

### Infra
- `npm run docker:infra` / `docker:infra:down` — Postgres + Redis
- `npm run docker:db` / `docker:redis` — one stack
- `npm run docker:up` / `docker:down` — full stack (apps + infra)

### Database
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:setup`

### App (PM2 — recommended)
- `npm run pm2:start` — start all services (`ecosystem.config.cjs`)
- `npm run pm2:status`
- `npm run pm2:logs`
- `npm run pm2:restart` / `pm2:reload`
- `npm run pm2:stop` / `pm2:delete`
- `npm run pm2:flush`

### App (foreground)
- `npm run dev:all` — concurrently (stop with Ctrl+C)
- `npm run dev:gateway` … `dev:nrc` — single service

## Routing

Client → API Gateway `:3000`

- `/openapi/v1/login`, `/auth/*`, `/device/*` → auth-service
- `/openapi/v1/profile`, `/dealer/*` → users-service
- `/openapi/v1/imei/*` → devices-service
- `/openapi/v1/tax/*` → tax-service
- `/openapi/v1/payments/*` → payments-service
- `/openapi/v1/claims` → claims-service
- `/openapi/v1/activities` → activities-service
- `/openapi/v1/nrc/*` → nrc-service
- `/api/bff/*` → BFF `:3002`

## Folders

```
database/                 Postgres compose, migrations, seeds
redis/                    Redis compose
ecosystem.config.cjs      PM2 process definitions
logs/                     PM2 logs
services/                 Microservices
packages/shared/          DB pool + Redis helpers
project-setup.txt         Full setup guide
project-start.txt         Short start guide
```

## Daily workflow

```bash
npm run docker:infra
npm run pm2:start
npm run pm2:status
```

Stop:

```bash
npm run pm2:delete
npm run docker:infra:down
```

## Ubuntu deploy (`/opt/ceir/backend`)

Project root on the server should be `/opt/ceir/backend`.
`ecosystem.config.cjs` resolves that path automatically (or via `CEIR_HOME`).

```bash
sudo mkdir -p /opt/ceir && sudo chown -R $USER:$USER /opt/ceir
git clone https://github.com/Phyo-KSPM/backend.git /opt/ceir/backend
cd /opt/ceir/backend
cp .env.example .env
npm install
npm run docker:infra
npm run db:setup
npm run pm2:start
npm run pm2:status
npx pm2 save && npx pm2 startup
```

Logs: `/opt/ceir/backend/logs/`

## Notes

- Copy `.env.example` → `.env` (never commit `.env`)
- Do not run `pm2:start` and `dev:all` at the same time (port conflict)
- First-time / schema change: run `npm run db:setup`

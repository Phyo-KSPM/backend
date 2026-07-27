# CEIR Backend (Microservices)

CEIR mobile API backend — domain services aligned with the ER diagram and public surface `/openapi/v1`.

**Repository:** https://github.com/Phyo-KSPM/backend.git

## Environment policy

| Environment | Postgres + Redis | App process manager |
|-------------|------------------|---------------------|
| **Windows local** | Docker (`npm run docker:infra` / `local:infra`) | PM2 or `dev:all` |
| **Linux production** (`/opt/ceir/backend`) | **Host packages only — no Docker** | PM2 |

`docker:*` / `local:infra` scripts are for **Windows local development only**.  
Do **not** run them on Linux production.

## Guides

| File | Purpose |
|------|---------|
| [`project-setup.txt`](./project-setup.txt) | Full setup (Windows local + Linux production) |
| [`project-start.txt`](./project-start.txt) | Short quick-start |

## Quick start — Windows local (Docker)

```bash
npm install
copy .env.example .env
npm run docker:infra          # or: npm run local:infra
npm run db:setup
npm run pm2:start
npm run pm2:status
```

## Quick start — Linux production (no Docker)

```bash
# Install host PostgreSQL + Redis first (see project-setup.txt §B)
cd /opt/ceir/backend
cp .env.example .env          # edit DATABASE_URL / REDIS_URL for host services
npm install
npm run db:setup
npm run pm2:start
npm run pm2:status
npx pm2 save && npx pm2 startup
```

Smoke checks:

- http://localhost:3000/health
- http://localhost:3000/openapi/v1/nrc/townships
- http://localhost:3001/docs — Swagger UI (Try it out → gateway `:3000`)

Demo login: `maung@dealer.com` / `secret123`  
Sample IMEI: `359876543210108`

## Infrastructure

| Component | Port | Notes |
|-----------|------|--------|
| api-gateway | 3000 | Public `/openapi/v1` (+ `/api`) |
| swagger-service | 3001 | Swagger UI at `/docs` |
| bff | 3002 | Backend-for-frontend |
| PostgreSQL | 5432 | Windows: Docker · Linux prod: host `postgresql` |
| Redis | 6379 | Windows: Docker · Linux prod: host `redis-server` |

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

- Migrations: `npm run db:migrate`
- Seeds: `npm run db:seed`
- Both: `npm run db:setup`
- Parameterized SQL (`$1`, `$2`, …) via `pg`
- Redis cache: profile, IMEI, NRC, payments list, activities

## Scripts

### App (PM2)
- `npm run pm2:start` / `pm2:status` / `pm2:logs` / `pm2:restart` / `pm2:stop` / `pm2:delete`

### App (foreground)
- `npm run dev:all`

### Database
- `npm run db:migrate` / `db:seed` / `db:setup`

### Docker — Windows local only
- `npm run docker:infra` / `local:infra` — Postgres + Redis containers
- `npm run docker:infra:down` / `local:infra:down`
- `npm run docker:db` / `docker:redis`
- `npm run docker:up` / `docker:down` — full stack (local optional)

## Routing

Client → API Gateway `:3000` → `/openapi/v1/...` (see `project-setup.txt`)

## Folders

```
database/                 migrations, seeds (+ compose for Windows local)
redis/                    compose for Windows local
ecosystem.config.cjs      PM2 (/opt/ceir/backend on Linux)
services/
packages/shared/
project-setup.txt
project-start.txt
```

## Notes

- Copy `.env.example` → `.env` (never commit `.env`)
- Linux production: install PostgreSQL + Redis on the host; point `.env` at `localhost`
- Do not run `pm2:start` and `dev:all` together (port conflict)

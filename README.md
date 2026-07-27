# CEIR Backend (Microservices)

Aligned with `backend_er_diagram.md` domain tables and `/openapi/v1` API.

## Infrastructure
- api-gateway :3000 — public surface `/openapi/v1` (and `/api`)
- bff :3002

## Domain services

| Service | Port | Tables | Routes |
| ------- | ---- | ------ | ------ |
| auth-service | 3010 | `users` (auth), `refresh_tokens`, `user_device_bindings` | `/login`, `/auth/refresh`, `/device/*` |
| users-service | 3011 | `users` | `/profile`, `/dealer/verify` |
| devices-service | 3012 | `devices`, `imei_check_logs` | `/imei/check`, `/imei/bulk-check` |
| tax-service | 3013 | `tax_applications`, `tax_application_items` | `/tax/applications` |
| payments-service | 3014 | `payments`, `payment_batches`, `payment_batch_items` | `/payments/*` |
| claims-service | 3015 | `device_claims`, `claim_documents` | `/claims` |
| activities-service | 3016 | `activities` | `/activities` |
| nrc-service | 3017 | `nrc_regions`, `nrc_townships` | `/nrc/townships` |

## Database & Redis
- PostgreSQL 16 — `database/docker-compose.yml` → `:5432` (`app_db`)
- Redis 7 — `redis/docker-compose.yml` → `:6379`
- Migrations: `npm run db:migrate` (`database/migrations/`)
- Seeds: `npm run db:seed` (`database/seeds/`)
- Setup both: `npm run db:setup`
- Domain services use parameterized SQL (`$1`, `$2`, …) + Redis cache (profile, IMEI, NRC, payments list, activities)

## Scripts
- `npm run docker:infra` — start Postgres + Redis
- `npm run db:setup` — migrate + seed
- `npm run dev:all` — start all app services (local)
- `npm run docker:up` / `docker:down` — full stack (apps + infra)
- `npm run docker:infra:down` — stop Postgres + Redis

## Routing
Client → API Gateway `:3000`

- `/openapi/v1/login` → auth-service
- `/openapi/v1/auth/*` → auth-service
- `/openapi/v1/device/*` → auth-service
- `/openapi/v1/profile`, `/dealer/*` → users-service
- `/openapi/v1/imei/*` → devices-service
- `/openapi/v1/tax/*` → tax-service
- `/openapi/v1/payments/*` → payments-service
- `/openapi/v1/claims` → claims-service
- `/openapi/v1/activities` → activities-service
- `/openapi/v1/nrc/*` → nrc-service
- `/api/bff/*` → BFF `:3002`

## Folders
- `database/` — Postgres compose + init SQL
- `redis/` — Redis compose
- `services/api-gateway`
- `services/bff`
- `services/auth-service` … `nrc-service`
- `packages/shared`

## Demo credentials
- Email: `maung@dealer.com`
- Password: `secret123`
- Sample IMEI: `359876543210108`

## How to run
See detailed guides:
- `project-setup.txt` — prerequisites + step-by-step + Git clone usage
- `project-start.txt` — short quick-start summary

### Clone from GitHub
```bash
git clone https://github.com/Phyo-KSPM/backend.git
cd backend
npm install
cp .env.example .env
npm run docker:infra
npm run db:setup
npm run dev:all
```


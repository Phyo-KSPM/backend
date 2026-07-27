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

Smoke checks (SSH / localhost only — `/health` is not public):

- `curl -s http://localhost:3000/health` (on the server)
- http://localhost:3000/openapi/v1/nrc/townships (needs Bearer token)
- http://localhost:3001/docs — Swagger UI (local / trusted only)

Demo login (local seed only — change/disable on production):  
`maung@dealer.com` / `aung@dealer.com` / `thiri@dealer.com` — password `secret123`  
Sample IMEI: `359876543210108`

### Security notes

Already in code: HS256 JWT + expiry, **gateway auth middleware** (token required except login/refresh),
401 without token on all business routes (including IMEI + NRC), ownership on pay/tax/payments,
weak-secret boot fail, Swagger off by default in production,
**gateway rate limits** (global / login / IMEI) + auth-service login limits.

**Production checklist (required)** — full detail in [`project-setup.txt`](./project-setup.txt) §B7:

1. Gateway `:3000` + BFF `:3002` stable — check **on server**: `curl -s http://localhost:3000/health` (not via public URL)
2. Strong unique `JWT_SECRET` (≥32 chars)
3. `SWAGGER_ENABLED=false`
4. Rotate/disable seed demo user (`maung@dealer.com` / `secret123`)
5. Firewall: public `80/443` (+ SSH) only; block `3001–3017`, `5432`, `6379`

**Public routes only:** `POST /login`, `POST /auth/refresh`, `POST /bff/login`.  
`GET /health` is **localhost-only** (blocked when reached via nginx / public proxy).  
**All other `/openapi/v1/*` routes** need `Authorization: Bearer <accessToken>`.

**Gateway rate limits (per IP):** all `120/min` · login `20/15min` · auth `40/15min` · IMEI `30/min` → **429** when exceeded.

**Next:** Postgres/Redis strong creds, `CORS_ORIGINS`, non-root PM2, real payment webhooks, IRD verify.

After deploy: `git pull` → set `JWT_SECRET` → `npm install` → `pm2:delete` → `pm2:start` → `pm2 save`

## Services (detailed READMEs)

| Service | Port | Doc |
|---------|------|-----|
| [api-gateway](./services/api-gateway/README.md) | 3000 | Edge: auth, rate limit, proxy |
| [swagger-service](./services/swagger-service/README.md) | 3001 | OpenAPI / Swagger UI |
| [bff](./services/bff/README.md) | 3002 | Aggregated login + dashboard |
| [auth-service](./services/auth-service/README.md) | 3010 | Login, JWT, device binding |
| [users-service](./services/users-service/README.md) | 3011 | Profile, dealer verify |
| [devices-service](./services/devices-service/README.md) | 3012 | IMEI check |
| [tax-service](./services/tax-service/README.md) | 3013 | Tax applications |
| [payments-service](./services/payments-service/README.md) | 3014 | Batches & payments |
| [claims-service](./services/claims-service/README.md) | 3015 | Device claims |
| [activities-service](./services/activities-service/README.md) | 3016 | Activity feed |
| [nrc-service](./services/nrc-service/README.md) | 3017 | NRC townships |
| [packages/shared](./packages/shared/README.md) | — | JWT, middleware, rate limit, DB, Redis |

## Infrastructure

| Component | Port | Notes |
|-----------|------|--------|
| PostgreSQL | 5432 | Windows: Docker · Linux prod: host `postgresql` |
| Redis | 6379 | Windows: Docker · Linux prod: host `redis-server` |

See [Services table](#services-detailed-readmes) above for app ports.


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

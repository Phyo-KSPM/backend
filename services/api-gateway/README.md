# api-gateway

**Port:** `3000` (`GATEWAY_PORT`)  
**Role:** Public edge of the CEIR mobile API. All clients (mobile, Postman) should call this service only.

## What it does

- Exposes the public API under `/openapi/v1` (and legacy `/api`)
- Proxies each path to the correct domain microservice
- Enforces **JWT auth** (except login / bff login / nrc townships)
- Enforces **rate limits** (global + login + IMEI)
- Serves **localhost-only** `/health` (blocked when reached via nginx / `X-Forwarded-For`)

## Public vs protected

| Access | Routes |
|--------|--------|
| Public (no token) | `POST /login`, `POST /auth/login`, `POST /bff/login`, `GET /nrc/townships` |
| Localhost only | `GET /health` |
| Bearer JWT required | Everything else under `/openapi/v1/*` |

## Rate limits (per client IP)

| Scope | Window | Max |
|-------|--------|-----|
| All gateway traffic | 1 minute | 120 |
| `/login` | 15 minutes | 20 |
| `/auth/*` | 15 minutes | 40 |
| `/imei/*` | 1 minute | 30 |

On limit: **HTTP 429** `{ "success": false, "error": { "code": "RATE_LIMITED", ... } }`  
Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

IP is taken from `X-Forwarded-For` (first hop) when behind nginx (`trust proxy` enabled).

## Proxy map

| Gateway path | Upstream |
|--------------|----------|
| `/login`, `/auth/*`, `/device/*` | auth-service `:3010` |
| `/profile`, `/users/*` | users-service `:3011` |
| `/imei/*` | devices-service `:3012` |
| `/tax/*` | tax-service `:3013` |
| `/payments/*` | payments-service `:3014` |
| `/claims/*` | claims-service `:3015` |
| `/activities/*` | activities-service `:3016` |
| `/nrc/*` | nrc-service `:3017` |
| `/bff/*` | bff `:3002` |

## Run

```bash
npm run dev:gateway
# or via PM2: api-gateway in ecosystem.config.cjs
```

## Env

- `GATEWAY_PORT` (default `3000`)
- `JWT_SECRET` (required, ≥32 chars)
- `CORS_ORIGINS` (optional allowlist)
- `*_SERVICE_URL` / `BFF_URL` for upstream targets

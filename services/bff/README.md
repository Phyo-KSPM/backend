# bff (Backend-for-Frontend)

**Port:** `3002` (`BFF_PORT`)  
**Role:** Aggregates multiple domain calls for a single mobile/screen-friendly response.

## What it does

- `POST /login` — forwards login to auth-service (same payload as gateway `/login`)
- `GET /dashboard` — loads profile + recent activities in parallel (requires Bearer token)
- `/health` — **localhost-only** (same rule as api-gateway)

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Proxy login to auth-service |
| GET | `/dashboard` | Bearer | `{ profile, recentActivities }` |
| GET | `/health` | Local | Health |

Via gateway: `/openapi/v1/bff/login`, `/openapi/v1/bff/dashboard`

## Notes

- Prefer calling **api-gateway** from mobile; BFF is an optional aggregation layer
- Dashboard forwards `Authorization` to users-service and activities-service
- Does not own a database

## Run

```bash
npm run dev:bff
```

# users-service

**Port:** `3011` (`USERS_SERVICE_PORT`)  
**Role:** User profile and dealer verification.

## What it does

- Returns the authenticated user’s profile (plus device binding if present)
- Marks a dealer as verified when business registration + TIN match (local check; not live IRD yet)
- Caches profile reads in Redis

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Bearer | Profile + optional `deviceBinding` |
| POST | `/dealer/verify` | Bearer | Verify dealer credentials |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/profile`, `/openapi/v1/dealer/verify`

## Dealer verify body

```json
{
  "businessRegistrationNo": "REG-2026-002",
  "tin": "234567890"
}
```

Both fields required. On success sets `dealer_verified = true` when data matches the user record (demo/local logic).

## Auth

All business routes require a valid Bearer JWT (`requireAuth` middleware).

## Data / cache

- Table: `users` (+ reads `user_device_bindings`)
- Redis key pattern: profile cache (invalidated on dealer verify)

## Run

```bash
npm run dev:users
```

# users-service

**Port:** `3011` (`USERS_SERVICE_PORT`)  
**Role:** Authenticated user profile (UI-visible fields only).

## What it does

- Returns the authenticated user’s public profile
- Caches profile reads in Redis

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Bearer | Public user profile |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/profile`

## Profile response

```json
{
  "id": "b1f2…",
  "email": "maung@dealer.com",
  "phone": "09791243682",
  "fullName": "Maung Maung",
  "nrcNo": "10/MADAMA(N)123456",
  "address": "No 27(G), Mayangone, Yangon"
}
```

## Auth

All business routes require a valid Bearer JWT (`requireAuth` middleware).

## Data / cache

- Table: `users`
- Redis key pattern: profile cache

## Run

```bash
npm run dev:users
```

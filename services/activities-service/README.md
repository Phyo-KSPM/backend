# activities-service

**Port:** `3016` (`ACTIVITIES_SERVICE_PORT`)  
**Role:** Recent activity feed for the logged-in user.

## What it does

- Returns recent activity rows for the JWT user
- Used by mobile home / BFF dashboard
- Cached briefly in Redis

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/activities` | Bearer | List activities |
| GET | `/health` | — | Service health |

Query: `limit` (default `10`, max **50**)

Via gateway: `/openapi/v1/activities?limit=10`

## Activity types (examples)

- `device_claimed`
- `tax_paid`
- (others written by payments / claims flows)

## Data / cache

Table: `activities`  
Redis: activities list cache

## Run

```bash
npm run dev:activities
```

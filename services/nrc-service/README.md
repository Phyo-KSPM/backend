# nrc-service

**Port:** `3017` (`NRC_SERVICE_PORT`)  
**Role:** Myanmar NRC region / township reference data.

## What it does

- Serves township list for forms (claim, profile address, etc.)
- Caches the list in Redis

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/nrc/townships` | Bearer | All townships (with region info) |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/nrc/townships`  
**Requires login** (no anonymous access).

## Data

Tables: `nrc_regions`, `nrc_townships`  
Seeded examples: Kamayut (`145`), Mayangone (`210`)

## Run

```bash
npm run dev:nrc
```

# devices-service

**Port:** `3012` (`DEVICES_SERVICE_PORT`)  
**Role:** IMEI / device registry lookups and check logging.

## What it does

- Looks up devices by IMEI1 (optional IMEI2)
- Returns registration / PMC / tax / blocking status
- Writes each check to `imei_check_logs` (for audit / activity)
- Caches IMEI results in Redis

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/imei/check` | Bearer | Single IMEI check |
| POST | `/imei/bulk-check` | Bearer | Bulk check (max **20** items) |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/imei/check`, `/openapi/v1/imei/bulk-check`  
Gateway also rate-limits `/imei/*` (30 / minute / IP).

## Request examples

Single:
```json
{ "imei1": "359876543210108", "imei2": "359876543210109" }
```

Bulk:
```json
{
  "imeis": [
    { "imei1": "359876543210108" },
    { "imei1": "359876543210200" }
  ]
}
```

## Seed demo IMEIs

| IMEI1 | Notes |
|-------|--------|
| `359876543210108` | Samsung, registered, unpaid, allowed |
| `359876543210200` | Infinix, registered, unpaid, allowed |
| `359876543210300` | Xiaomi, partial, unpaid, **blocked** |

## Data

Tables: `devices`, `imei_check_logs`

## Run

```bash
npm run dev:devices
```

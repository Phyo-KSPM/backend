# tax-service

**Port:** `3013` (`TAX_SERVICE_PORT`)  
**Role:** Tax applications for one or more devices (IMEI-based).

## What it does

- Creates a tax application with 1–10 devices
- Calculates demo tax line items (customs / commercial / redemption)
- Returns application detail by id (**owner only**)

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tax/applications` | Bearer | Create application |
| GET | `/tax/applications/:id` | Bearer | Get by id (ownership check) |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/tax/applications`, `/openapi/v1/tax/applications/{id}`

## Create body

```json
{
  "devices": [
    { "imei1": "359876543210108" },
    { "imei1": "359876543210200", "imei2": "359876543210201" }
  ]
}
```

- `devices` length must be **1–10**
- Unknown IMEI → **404** `IMEI_NOT_FOUND`
- Other user’s application id → **403** `FORBIDDEN`

## Data

Tables: `tax_applications`, `tax_application_items` (joins `devices`)

## Run

```bash
npm run dev:tax
```

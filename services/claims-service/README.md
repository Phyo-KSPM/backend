# claims-service

**Port:** `3015` (`CLAIMS_SERVICE_PORT`)  
**Role:** Device ownership claims (lost/stolen / claimant workflow).

## What it does

- Creates a claim from IMEI (+ optional reason + device photo)
- Enriches claimant identity from the authenticated user profile
- Lists claims for the authenticated user
- Stores `device_photo` document only

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/claims` | Bearer | Create claim |
| GET | `/claims` | Bearer | List my claims |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/claims`

## Create body

```json
{
  "imei1": "359876543210108",
  "imei2": null,
  "reason": "IMEI2 lost after factory reset",
  "devicePhotoUrl": "https://example.com/device.jpg"
}
```

Required: `imei1`  
Server enrichment: `fullName`, `phone`, `nrcNo`, `address`, `townshipId` from profile

## Data

Tables: `device_claims`, `claim_documents` (`doc_type = device_photo`)

## Run

```bash
npm run dev:claims
```

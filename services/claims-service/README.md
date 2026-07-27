# claims-service

**Port:** `3015` (`CLAIMS_SERVICE_PORT`)  
**Role:** Device ownership claims (lost/stolen / claimant workflow).

## What it does

- Creates a claim with claimant identity + IMEI (+ optional document URLs)
- Lists claims for the authenticated user
- Stores optional document URLs as claim documents

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
  "fullName": "Aung Aung",
  "nrcNumber": "12/ABC(N)123456",
  "phone": "09123456789",
  "address": "Yangon",
  "townshipId": 145,
  "imei1": "359876543210108",
  "imei2": null,
  "nrcFrontUrl": "https://example.com/nrc-front.jpg",
  "nrcBackUrl": "https://example.com/nrc-back.jpg",
  "devicePhotoUrl": "https://example.com/device.jpg"
}
```

Required: `fullName`, `nrcNumber`, `phone`, `address`, `townshipId`, `imei1`

## Data

Tables: `device_claims`, `claim_documents`

## Run

```bash
npm run dev:claims
```

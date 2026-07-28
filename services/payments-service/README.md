# payments-service

**Port:** `3014` (`PAYMENTS_SERVICE_PORT`)  
**Role:** Payment batches and payment history.

## What it does

- Creates a payment batch from IMEI items (`items` only; payer context from JWT user)
- “Pays” a batch (simulated gateway — **not** a real MPU/KBZ/Wave webhook yet)
- Lists / gets payments for the authenticated user only

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/batches` | Bearer | Create batch |
| POST | `/payments/batches/:id/pay` | Bearer | Pay batch (owner only) |
| GET | `/payments` | Bearer | Paginated list (`page`, `pageSize`) |
| GET | `/payments/:id` | Bearer | Payment detail (owner only) |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/payments/...`

## Create batch body

```json
{
  "items": [{ "imei1": "359876543210108", "imei2": "359876543210109" }]
}
```

## Pay batch body

```json
{ "paymentMethod": "mpu" }
```

`paymentMethod`: `mpu` | `kbzpay` | `wavepay`

## Business rules

- Pay / get by other user → **403**
- Already paid batch → **409** `ALREADY_PAID`
- Payment success is **simulated** (marks devices `tax_payment_status = paid`, writes activity)

## Data / cache

Tables: `payment_batches`, `payment_batch_items`, `payments`  
Redis: payments list cache

## Run

```bash
npm run dev:payments
```

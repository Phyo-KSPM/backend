# auth-service

**Port:** `3010` (`AUTH_SERVICE_PORT`)  
**Role:** Authentication, token issue/refresh, and one-device binding.

## What it does

- Validates email/password (bcrypt)
- Issues **HS256 JWT** access tokens + opaque refresh tokens
- Binds each account to a single `deviceFingerprint` (mobile device lock)
- Stores refresh token hashes in Postgres

## Routes (direct service)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Login + device bind/check |
| POST | `/auth/login` | No | Same as login (under `/auth`) |
| POST | `/auth/refresh` | No | Rotate access + refresh tokens |
| GET | `/device/binding` | Bearer | Current device binding |
| POST | `/device/bind` | Bearer | Bind / refresh binding |
| GET | `/health` | — | Service health |

Via gateway: `/openapi/v1/login`, `/openapi/v1/auth/refresh`, `/openapi/v1/device/*`

## Login body

```json
{
  "email": "aung@dealer.com",
  "password": "secret123",
  "deviceFingerprint": "unique-phone-id",
  "deviceName": "Pixel 8",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

`email`, `password`, `deviceFingerprint` are required.

## Device binding rules

1. First successful login → create binding for that fingerprint  
2. Same fingerprint → login OK (updates last seen)  
3. Different fingerprint → **403** `ACCOUNT_BOUND_TO_OTHER_DEVICE`

## Tokens

- **accessToken:** HS256 JWT (`sub`, `email`, `exp`); default TTL 3600s (`ACCESS_TOKEN_TTL_SEC`)
- **refreshToken:** random `rt_…`, SHA-256 hashed in DB, ~7 days
- Refresh deletes the old refresh row and issues a new pair

## Rate limit (service-level)

- `/login`: 30 / 15 minutes / IP  
- `/auth/*`: 60 / 15 minutes / IP  

(Gateway also rate-limits these paths.)

## Data

Tables: `users`, `refresh_tokens`, `user_device_bindings`

## Run

```bash
npm run dev:auth
```

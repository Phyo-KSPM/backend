# auth-service

**Port:** `3010` (`AUTH_SERVICE_PORT`)  
**Role:** JWT access + refresh sessions; email or Agent Account ID login.

## Login identifiers

| Field | Use |
|-------|-----|
| `email` | Mobile / email user |
| `agentId` | Web Agent User (`AGT-2026-001`, …) |
| `password` | Required |
| `deviceFingerprint` | Required for mobile (`android` / `ios`) |
| `platform` | `android` \| `ios` = device bind; `web` = admin console (no bind) |

## Client paths (via api-gateway only)

| Client | Gateway path | Notes |
|--------|--------------|--------|
| Mobile | `POST /openapi/v1/bff/login` | BFF shapes mobile response (`success`, `user.agentId`, `device`) |
| Web admin | `POST /openapi/v1/login` | Raw auth response; use `platform: "web"` |

## Mobile body example

```json
{
  "email": "aung@dealer.com",
  "password": "secret123",
  "deviceFingerprint": "unique-phone-id",
  "platform": "android",
  "deviceName": "Pixel 8",
  "appVersion": "1.0.0"
}
```

## Web Agent User example

```json
{
  "agentId": "AGT-2026-002",
  "password": "secret123",
  "platform": "web",
  "deviceFingerprint": "ceir-admin-web-…",
  "deviceName": "CEIR Admin Console"
}
```

## Seed agent IDs

| Email | Agent Account ID |
|-------|------------------|
| maung@dealer.com | AGT-2026-001 |
| aung@dealer.com | AGT-2026-002 |
| thiri@dealer.com | AGT-2026-003 |

Password: `secret123`

## Tokens

- **accessToken:** HS256 JWT (`sub`, `email`, `jti`, `exp`)
- **refreshToken:** `rt_…`, hash in `auth_sessions`
- Web login does **not** overwrite mobile device binding

## Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/login` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | Bearer |
| GET/POST | `/device/*` | Bearer |

## Run

```bash
npm run db:migrate
npm run db:seed
npm run dev:auth
```

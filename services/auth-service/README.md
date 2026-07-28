# auth-service

**Port:** `3010` (`AUTH_SERVICE_PORT`)  
**Role:** JWT access sessions; email or Agent Account ID login. No refresh-token endpoint.

## Login identifiers

| Field | Use |
|-------|-----|
| `email` | Mobile / email user |
| `agentId` | Web Agent User (`AGT-2026-001`, …) |
| `password` | Required |
| `deviceId` | Required for mobile (`android` / `ios`) |
| `platform` | `android` \| `ios` = device bind; `web` = admin console (no bind) |

## Client paths (via api-gateway only)

| Client | Gateway path | Notes |
|--------|--------------|--------|
| Mobile | `POST /openapi/v1/bff/login` | BFF shapes mobile response |
| Web admin | `POST /openapi/v1/login` | Raw auth response; use `platform: "web"` |

## Mobile body example

```json
{
  "email": "aung@dealer.com",
  "password": "secret123",
  "deviceId": "android-a1b2c3d4",
  "platform": "android",
  "deviceName": "Galaxy A16",
  "appVersion": "1.0.0+1"
}
```

## Web Agent User example

```json
{
  "agentId": "AGT-2026-002",
  "password": "secret123",
  "platform": "web",
  "deviceId": "ceir-admin-web-…",
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

- **accessToken:** HS256 JWT (`sub`, `email`, `jti`, `exp`) — default TTL 7 days
- Session row in `auth_sessions` for logout revoke only (no refresh token returned)
- Web login does **not** overwrite mobile device binding

## Public user fields

`id`, `email`, `phone`, `fullName`, `nrcNo`, `address`

## Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/login` | No |
| POST | `/auth/login` | No |
| POST | `/auth/logout` | Bearer |
| GET/POST | `/device/*` | Bearer |

## Run

```bash
npm run db:migrate
npm run db:seed
npm run dev:auth
```

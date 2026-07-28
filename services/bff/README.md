# bff (Backend-for-Frontend)

**Port:** `3002` (`BFF_PORT`)  
**Role:** Shapes mobile-friendly responses. Clients should call **api-gateway** only.

## Routes (via gateway)

| Method | Gateway path | Auth | Description |
|--------|--------------|------|-------------|
| POST | `/openapi/v1/bff/login` | No | Mobile login shape |
| GET | `/openapi/v1/bff/dashboard` | Bearer | `{ success, profile, recentActivities }` |
| GET | `/health` | Local | Health |

## Mobile login response shape

```json
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "rt_...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "...",
    "agentId": "AGT-2026-002",
    "email": "aung@dealer.com",
    "fullName": "Aung Aung",
    "phone": "...",
    "dealerVerified": true
  },
  "device": {
    "bound": true,
    "fingerprint": "...",
    "name": "...",
    "platform": "android",
    "boundAt": "..."
  }
}
```

Accepts `email` **or** `agentId` + `password` + `deviceFingerprint`.

Web admin should use gateway `POST /openapi/v1/login` with `platform: "web"` (not this BFF shape).

## Run

```bash
npm run dev:bff
```

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
  "tokenType": "Bearer",
  "expiresIn": 604800,
  "deviceBinding": {
    "deviceId": "android-a1b2c3d4",
    "boundAt": "2026-07-02T13:26:00Z"
  },
  "user": {
    "id": "...",
    "email": "aung@dealer.com",
    "phone": "...",
    "fullName": "Aung Aung",
    "nrcNo": "9/KAMANA(N)654321",
    "address": "..."
  }
}
```

Accepts `email` **or** `agentId` + `password` + `deviceId`.

Web admin should use gateway `POST /openapi/v1/login` with `platform: "web"` (not this BFF shape).

## Run

```bash
npm run dev:bff
```

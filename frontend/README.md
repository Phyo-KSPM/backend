# CEIR Admin (frontend)

React admin console for CEIR account / platform management.

**Scope now:** Login page only (full admin screens next).

## Stack

- Vite + React + TypeScript
- React Router
- Calls backend `POST /openapi/v1/login`

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173/login

## Env

```env
VITE_API_BASE_URL=http://localhost:3000/openapi/v1
```

Production example:

```env
VITE_API_BASE_URL=https://service.ceir.gov.mm/openapi/v1
```

## Notes

- Browser stores a stable `deviceId` in `localStorage` (API requires it for non-web binds; web admin sends it with `platform: "web"`).
- If login returns `ACCOUNT_BOUND_TO_OTHER_DEVICE`, that user is bound to another device — use a free test account or clear the binding in DB.
- After login you land on a temporary “signed in” placeholder until admin management UI is built.

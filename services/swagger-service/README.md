# swagger-service

**Port:** `3001` (`SWAGGER_PORT`)  
**Role:** OpenAPI 3 docs + Swagger UI for exploring the gateway API.

## What it does

- Serves Swagger UI at `/docs`
- Serves raw OpenAPI JSON at `/openapi.json`
- Points “Try it out” at `GATEWAY_URL` (default `http://localhost:3000`) + `/openapi/v1`

## Security

| Env | Behavior |
|-----|----------|
| `NODE_ENV=production` and `SWAGGER_ENABLED` unset/false | UI **disabled** (404 / `SWAGGER_DISABLED`) |
| `SWAGGER_ENABLED=true` | UI enabled (trusted networks only) |
| `SWAGGER_DEMO_HINTS=true` | Extra local-demo notes in the spec |

Do **not** expose `:3001` on the public firewall.

## Routes

| Path | Description |
|------|-------------|
| `/` | Redirect → `/docs` (when enabled) |
| `/docs` | Swagger UI |
| `/openapi.json` | OpenAPI document |
| `/health` | Service health |

## Run

```bash
npm run dev:swagger
# Try-it-out against production gateway:
# $env:GATEWAY_URL="https://service.ceir.gov.mm"; npm run dev:swagger
```

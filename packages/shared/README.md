# @ceir/shared (packages/shared)

Shared libraries used by all microservices (imported via relative paths).

## Modules

| Path | Purpose |
|------|---------|
| `src/auth/jwt.ts` | HS256 sign/verify, `assertJwtSecret`, `resolveUserId` |
| `src/auth/middleware.ts` | `requireAuth`, `requireAuthUnless`, gateway public-route helper |
| `src/auth/rate-limit.ts` | In-memory rate limiter + `clientIp` (X-Forwarded-For aware) |
| `src/http/local-only-health.ts` | `/health` allowed only from localhost (not via public proxy) |
| `src/db/pool.ts` | PostgreSQL pool (`connectDatabase`, `query`) |
| `src/redis/client.ts` | Redis connect + cache get/set/del helpers |
| `src/utils/response.ts` | Small `ok` / `fail` helpers |
| `src/errors/app-error.ts` | Shared error type |
| `src/types` | Shared TypeScript types |

## Notes

- JWT secret must be strong (≥32 chars); production boot fails on weak defaults
- Rate limit buckets are **per Node process** (fine for PM2 `fork` × 1 instance)
- Domain services import with paths like `../../../../packages/shared/src/...` from `src/routes` or `src/config`

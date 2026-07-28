import dotenv from 'dotenv';
import { assertJwtSecret } from '../../../../packages/shared/src/auth/jwt';

dotenv.config(
  process.env.DOTENV_CONFIG_PATH
    ? { path: process.env.DOTENV_CONFIG_PATH }
    : undefined
);

export const env = {
  port: Number(process.env.AUTH_SERVICE_PORT) || 3010,
  jwtSecret: assertJwtSecret(process.env.JWT_SECRET),
  accessTokenTtlSec: Number(process.env.ACCESS_TOKEN_TTL_SEC) || 3600,
  /** Refresh / session lifetime in seconds (default 7 days) */
  refreshTokenTtlSec: Number(process.env.REFRESH_TOKEN_TTL_SEC) || 7 * 24 * 60 * 60,
  db: {
    type: process.env.DB_TYPE || 'postgresql',
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_DATABASE || 'app_db',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
};

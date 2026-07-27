import dotenv from 'dotenv';
dotenv.config(
  process.env.DOTENV_CONFIG_PATH
    ? { path: process.env.DOTENV_CONFIG_PATH }
    : undefined
);

function parseOrigins(raw?: string): string[] | true {
  if (!raw || raw.trim() === '' || raw.trim() === '*') {
    // Dev default: allow all. Production must set CORS_ORIGINS explicitly.
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[gateway] CORS_ORIGINS not set in production — defaulting to same-host only (no browser CORS)'
      );
      return [];
    }
    return true;
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.GATEWAY_PORT) || 3000,
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  bffUrl: process.env.BFF_URL || 'http://localhost:3002',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3010',
  usersServiceUrl: process.env.USERS_SERVICE_URL || 'http://localhost:3011',
  devicesServiceUrl: process.env.DEVICES_SERVICE_URL || 'http://localhost:3012',
  taxServiceUrl: process.env.TAX_SERVICE_URL || 'http://localhost:3013',
  paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3014',
  claimsServiceUrl: process.env.CLAIMS_SERVICE_URL || 'http://localhost:3015',
  activitiesServiceUrl: process.env.ACTIVITIES_SERVICE_URL || 'http://localhost:3016',
  nrcServiceUrl: process.env.NRC_SERVICE_URL || 'http://localhost:3017',
};

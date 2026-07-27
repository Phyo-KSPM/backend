import dotenv from 'dotenv';
dotenv.config(
  process.env.DOTENV_CONFIG_PATH
    ? { path: process.env.DOTENV_CONFIG_PATH }
    : undefined
);

const isProd = process.env.NODE_ENV === 'production';
const swaggerEnabledEnv = process.env.SWAGGER_ENABLED;
const swaggerEnabled =
  swaggerEnabledEnv === 'true' ||
  (swaggerEnabledEnv !== 'false' && !isProd);

export const env = {
  port: Number(process.env.SWAGGER_PORT) || 3001,
  gatewayUrl: process.env.GATEWAY_URL || `http://localhost:${process.env.GATEWAY_PORT || 3000}`,
  swaggerEnabled,
  exposeDemoHints: process.env.SWAGGER_DEMO_HINTS === 'true',
};

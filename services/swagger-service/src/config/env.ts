import dotenv from 'dotenv';
dotenv.config(
  process.env.DOTENV_CONFIG_PATH
    ? { path: process.env.DOTENV_CONFIG_PATH }
    : undefined
);

export const env = {
  port: Number(process.env.SWAGGER_PORT) || 3001,
  gatewayUrl: process.env.GATEWAY_URL || `http://localhost:${process.env.GATEWAY_PORT || 3000}`,
};

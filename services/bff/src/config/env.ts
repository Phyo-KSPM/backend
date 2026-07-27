import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.BFF_PORT) || 3002,
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3010',
  usersServiceUrl: process.env.USERS_SERVICE_URL || 'http://localhost:3011',
  devicesServiceUrl: process.env.DEVICES_SERVICE_URL || 'http://localhost:3012',
  taxServiceUrl: process.env.TAX_SERVICE_URL || 'http://localhost:3013',
  paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3014',
  claimsServiceUrl: process.env.CLAIMS_SERVICE_URL || 'http://localhost:3015',
  activitiesServiceUrl: process.env.ACTIVITIES_SERVICE_URL || 'http://localhost:3016',
  nrcServiceUrl: process.env.NRC_SERVICE_URL || 'http://localhost:3017',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
};

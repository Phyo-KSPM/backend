import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.ACTIVITIES_SERVICE_PORT) || 3016,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
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

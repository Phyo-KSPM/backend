import express from 'express';
import cors from 'cors';
import { rateLimit } from '../../../../packages/shared/src/auth/rate-limit';
import { env } from './config/env';
import { connectInfra } from './config/database';
import { AuthController } from './controllers/auth.controller';
import authRoutes from './routes/auth.routes';
import deviceRoutes from './routes/device.routes';

async function bootstrap() {
  await connectInfra();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ service: 'auth-service', status: 'ok', port: env.port });
  });

  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
  app.post('/login', loginLimiter, AuthController.login);
  app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }), authRoutes);
  app.use('/device', deviceRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });

  app.listen(env.port, () => {
    console.log(`[auth-service] http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

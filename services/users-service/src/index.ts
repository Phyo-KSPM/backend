import express from 'express';
import cors from 'cors';
import { requireAuth } from '../../../packages/shared/src/auth/middleware';
import { env } from './config/env';
import { connectInfra } from './config/database';
import { UsersController } from './controllers/users.controller';
import routes from './routes/users.routes';

async function bootstrap() {
  await connectInfra();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ service: 'users-service', status: 'ok', port: env.port });
  });

  const auth = requireAuth(env.jwtSecret);
  app.get('/profile', auth, UsersController.profile);
  app.post('/dealer/verify', auth, UsersController.verifyDealer);
  app.use('/users', routes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });

  app.listen(env.port, () => {
    console.log(`[users-service] http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

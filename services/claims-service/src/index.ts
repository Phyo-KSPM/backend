import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectInfra } from './config/database';
import routes from './routes/claims.routes';

async function bootstrap() {
  await connectInfra();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ service: 'claims-service', status: 'ok', port: env.port });
  });

  app.use('/claims', routes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });

  app.listen(env.port, () => {
    console.log(`[claims-service] http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

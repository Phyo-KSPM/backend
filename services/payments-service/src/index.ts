import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectInfra } from './config/database';
import routes from './routes/payments.routes';

async function bootstrap() {
  await connectInfra();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ service: 'payments-service', status: 'ok', port: env.port });
  });

  app.use('/payments', routes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });

  app.listen(env.port, () => {
    console.log(`[payments-service] http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

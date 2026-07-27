import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import routes from './routes';

const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.disable('x-powered-by');
app.use(requestIdMiddleware);

app.get('/health', (_req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    port: env.port,
    bff: env.bffUrl,
  });
});

app.use('/openapi/v1', routes);
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const server = app.listen(env.port, () => {
  console.log(`[api-gateway] http://localhost:${env.port}`);
  console.log(`  /openapi/v1/* and /api/* -> domain services`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[api-gateway] failed to bind :${env.port}`, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[api-gateway] uncaughtException', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[api-gateway] unhandledRejection', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import { localOnlyHealth } from '../../../packages/shared/src/http/local-only-health';
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

app.get(
  '/health',
  localOnlyHealth((_req, res) => {
    res.json({
      service: 'api-gateway',
      status: 'ok',
      port: env.port,
      bff: env.bffUrl,
    });
  })
);

app.use('/openapi/v1', routes);
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => {
    console.error(`[api-gateway] received ${sig}, shutting down`);
    process.exit(0);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[api-gateway] uncaughtException', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[api-gateway] unhandledRejection', err);
});

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[api-gateway] http://0.0.0.0:${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[api-gateway] failed to bind :${env.port}`, err.code || err.message);
  process.exit(1);
});

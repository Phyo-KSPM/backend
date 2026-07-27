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

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[api-gateway] http://0.0.0.0:${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[api-gateway] failed to bind :${env.port}`, err.code || err.message);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`[api-gateway] ${signal}, closing :${env.port}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

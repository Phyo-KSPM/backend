import express from 'express';
import cors from 'cors';
import { localOnlyHealth } from '../../../packages/shared/src/http/local-only-health';
import { env } from './config/env';
import routes from './routes';

const app = express();
app.use(cors());
app.disable('x-powered-by');
app.use(express.json());

app.get(
  '/health',
  localOnlyHealth((_req, res) => {
    res.json({ service: 'bff', status: 'ok', port: env.port });
  })
);

app.use(routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => {
    console.error(`[bff] received ${sig}, shutting down`);
    process.exit(0);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[bff] uncaughtException', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[bff] unhandledRejection', err);
});

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[bff] http://0.0.0.0:${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[bff] failed to bind :${env.port}`, err.code || err.message);
  process.exit(1);
});

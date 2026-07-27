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

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[bff] http://0.0.0.0:${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[bff] failed to bind :${env.port}`, err.code || err.message);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`[bff] ${signal}, closing :${env.port}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

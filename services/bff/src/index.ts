import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';

const app = express();
app.use(cors());
app.disable('x-powered-by');
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'bff', status: 'ok', port: env.port });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const server = app.listen(env.port, () => {
  console.log(`[bff] http://localhost:${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[bff] failed to bind :${env.port}`, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[bff] uncaughtException', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[bff] unhandledRejection', err);
  process.exit(1);
});

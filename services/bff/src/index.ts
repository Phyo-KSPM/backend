import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'bff', status: 'ok', port: env.port });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.listen(env.port, () => {
  console.log(`[bff] http://localhost:${env.port}`);
});

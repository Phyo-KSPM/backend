import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import routes from './routes';

const app = express();

app.use(
  cors({
    origin: env.corsOrigins === true ? true : env.corsOrigins,
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

// CEIR public API surface (ER diagram) + legacy /api prefix
app.use('/openapi/v1', routes);
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.listen(env.port, () => {
  console.log(`[api-gateway] http://localhost:${env.port}`);
  console.log(`  /openapi/v1/* and /api/* -> domain services`);
  console.log(`  auth:${env.authServiceUrl} users:${env.usersServiceUrl}`);
  console.log(`  devices:${env.devicesServiceUrl} tax:${env.taxServiceUrl}`);
  console.log(`  payments:${env.paymentsServiceUrl} claims:${env.claimsServiceUrl}`);
  console.log(`  activities:${env.activitiesServiceUrl} nrc:${env.nrcServiceUrl}`);
});

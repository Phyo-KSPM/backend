import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { buildOpenApiDoc } from './openapi';

const app = express();
app.use(cors());
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({
    service: 'swagger-service',
    status: 'ok',
    port: env.port,
    enabled: env.swaggerEnabled,
    gateway: env.gatewayUrl,
    ui: env.swaggerEnabled ? `http://localhost:${env.port}/docs` : null,
  });
});

if (!env.swaggerEnabled) {
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'SWAGGER_DISABLED',
        message:
          'Swagger UI is disabled. Set SWAGGER_ENABLED=true only on trusted networks.',
      },
    });
  });
} else {
  const openApiDoc = buildOpenApiDoc();

  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDoc);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDoc, {
      customSiteTitle: 'CEIR API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
      },
    })
  );

  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });
}

app.listen(env.port, () => {
  if (!env.swaggerEnabled) {
    console.log(`[swagger-service] DISABLED on port ${env.port} (production default)`);
    return;
  }
  console.log(`[swagger-service] http://localhost:${env.port}/docs`);
  console.log(`  OpenAPI JSON: http://localhost:${env.port}/openapi.json`);
  console.log(`  Try-it-out target: ${env.gatewayUrl}/openapi/v1`);
});

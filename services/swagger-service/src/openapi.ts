import { env } from './config/env';

const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string' },
      },
    },
  },
} as const;

const bearerAuth = [{ BearerAuth: [] }];

export function buildOpenApiDoc() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'CEIR Backend API',
      version: '1.0.0',
      description: [
        'Public surface via **API Gateway** (`/openapi/v1`).',
        '',
        'Authorize with a valid `accessToken` from `POST /login` (Bearer HS256 JWT).',
        '',
        '**All API routes require Bearer token** except `POST /login`, `POST /bff/login`, and `GET /nrc/townships`.',
        'Protected routes return **401** without a valid token. Tokens expire (`expiresIn`).',
        env.exposeDemoHints
          ? '\n\n**Local demo only:** seed user may exist after `db:seed` — never reuse demo passwords in production.'
          : '',
      ].join('\n'),
    },
    servers: [
      {
        url: `${env.gatewayUrl}/openapi/v1`,
        description: 'API Gateway (public)',
      },
      {
        url: `${env.gatewayUrl}/api`,
        description: 'API Gateway (legacy /api)',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Login, logout, device binding' },
      { name: 'Users', description: 'Profile' },
      { name: 'Devices', description: 'IMEI check' },
      { name: 'Tax', description: 'Tax applications' },
      { name: 'Payments', description: 'Payment batches & history' },
      { name: 'Claims', description: 'Device ownership claims' },
      { name: 'Activities', description: 'User activity feed' },
      { name: 'NRC', description: 'NRC townships reference (public)' },
      { name: 'BFF', description: 'Backend-for-frontend aggregates' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste accessToken from POST /login',
        },
      },
      schemas: {
        Error: errorSchema,
        LoginRequest: {
          type: 'object',
          description:
            'Provide password plus either email or agentId. Mobile must send deviceId (android/ios). Web admin uses platform=web (no device bind).',
          required: ['password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'maung@dealer.com' },
            agentId: {
              type: 'string',
              example: 'AGT-2026-001',
              description: 'Agent Account ID (web Agent User login)',
            },
            password: { type: 'string', format: 'password', example: 'secret123' },
            deviceId: {
              type: 'string',
              example: 'android-a1b2c3d4',
            },
            deviceName: { type: 'string', example: 'Galaxy A16' },
            platform: {
              type: 'string',
              enum: ['android', 'ios', 'web'],
              example: 'android',
            },
            appVersion: { type: 'string', example: '1.0.0+1' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'integer', example: 604800 },
            deviceBinding: {
              oneOf: [
                { $ref: '#/components/schemas/DeviceBinding' },
                { type: 'null' },
              ],
            },
            user: { $ref: '#/components/schemas/PublicUser' },
          },
        },
        MobileLoginResponse: {
          type: 'object',
          description: 'Shaped by BFF for mobile clients (`POST /bff/login`)',
          properties: {
            success: { type: 'boolean', example: true },
            accessToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'integer', example: 604800 },
            deviceBinding: {
              oneOf: [
                { $ref: '#/components/schemas/DeviceBinding' },
                { type: 'null' },
              ],
            },
            user: { $ref: '#/components/schemas/PublicUser' },
          },
        },
        PublicUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            phone: { type: 'string', nullable: true },
            fullName: { type: 'string' },
            nrcNo: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
          },
        },
        DeviceBinding: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
            boundAt: { type: 'string', format: 'date-time' },
          },
        },
        ImeiPair: {
          type: 'object',
          required: ['imei1'],
          properties: {
            imei1: { type: 'string', example: '359876543210108' },
            imei2: { type: 'string', nullable: true },
          },
        },
        ImeiCheckResult: {
          type: 'object',
          properties: {
            deviceId: { type: 'integer' },
            brand: { type: 'string' },
            productName: { type: 'string' },
            modelName: { type: 'string' },
            serialNumber: { type: 'string' },
            imei1: { type: 'string' },
            imei2: { type: 'string', nullable: true },
            registrationStatus: {
              type: 'string',
              enum: ['registered', 'partial', 'not_registered'],
            },
            pmcStatus: { type: 'string', enum: ['correct', 'incorrect'] },
            taxPaymentStatus: { type: 'string', enum: ['paid', 'unpaid', 'pending'] },
            blockingStatus: { type: 'string', enum: ['allowed', 'blocked'] },
            found: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Authenticate and bind/verify deviceId. Returns access token only (no refresh).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Access token + user + device binding',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '401': {
              description: 'Invalid credentials',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '403': {
              description: 'Account bound to another device',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke current session',
          security: bearerAuth,
          responses: {
            '200': {
              description: 'Session revoked',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { success: { type: 'boolean' } },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/device/binding': {
        get: {
          tags: ['Auth'],
          summary: 'Get device binding',
          security: bearerAuth,
          responses: {
            '200': {
              description: 'Current binding',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DeviceBinding' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'No binding',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/device/bind': {
        post: {
          tags: ['Auth'],
          summary: 'Bind device',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['deviceId'],
                  properties: {
                    deviceId: { type: 'string' },
                    deviceName: { type: 'string' },
                    platform: { type: 'string', enum: ['android', 'ios'] },
                    appVersion: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Bound',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DeviceBinding' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '409': {
              description: 'Already bound to another device',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          security: bearerAuth,
          responses: {
            '200': {
              description: 'Public user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PublicUser' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/imei/check': {
        post: {
          tags: ['Devices'],
          summary: 'Check single IMEI',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ImeiPair' },
              },
            },
          },
          responses: {
            '200': {
              description: 'IMEI check result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ImeiCheckResult' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'IMEI not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/imei/bulk-check': {
        post: {
          tags: ['Devices'],
          summary: 'Bulk IMEI check',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['imeis'],
                  properties: {
                    imeis: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ImeiPair' },
                      example: [{ imei1: '359876543210108' }],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Results list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ImeiCheckResult' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/tax/applications': {
        post: {
          tags: ['Tax'],
          summary: 'Create tax application',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['devices'],
                  properties: {
                    devices: {
                      type: 'array',
                      minItems: 1,
                      maxItems: 10,
                      items: { $ref: '#/components/schemas/ImeiPair' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created tax application' },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'IMEI not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/tax/applications/{id}': {
        get: {
          tags: ['Tax'],
          summary: 'Get tax application by id',
          security: bearerAuth,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': { description: 'Tax application' },
            '404': {
              description: 'Not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/payments/batches': {
        post: {
          tags: ['Payments'],
          summary: 'Create payment batch',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ImeiPair' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created batch' },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'IMEI not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/payments/batches/{id}/pay': {
        post: {
          tags: ['Payments'],
          summary: 'Pay a payment batch',
          security: bearerAuth,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Batch id',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['paymentMethod'],
                  properties: {
                    paymentMethod: {
                      type: 'string',
                      enum: ['mpu', 'kbzpay', 'wavepay'],
                      example: 'mpu',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Payment result' },
            '404': {
              description: 'Batch not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/payments': {
        get: {
          tags: ['Payments'],
          summary: 'List payments',
          security: bearerAuth,
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
          ],
          responses: {
            '200': { description: 'Paginated payments' },
          },
        },
      },
      '/payments/{id}': {
        get: {
          tags: ['Payments'],
          summary: 'Get payment by id',
          security: bearerAuth,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Payment' },
            '404': {
              description: 'Not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/claims': {
        get: {
          tags: ['Claims'],
          summary: 'List claims',
          security: bearerAuth,
          responses: {
            '200': { description: 'Claims list' },
          },
        },
        post: {
          tags: ['Claims'],
          summary: 'Create device claim',
          description:
            'UI-minimal payload: imei1 + optional imei2/reason/devicePhoto. Claimant identity is enriched from the authenticated profile.',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['imei1'],
                  properties: {
                    imei1: { type: 'string', example: '359876543210108' },
                    imei2: { type: 'string', nullable: true },
                    reason: { type: 'string', nullable: true },
                    devicePhotoUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created claim' },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/activities': {
        get: {
          tags: ['Activities'],
          summary: 'List recent activities',
          security: bearerAuth,
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
            },
          ],
          responses: {
            '200': { description: 'Activities' },
          },
        },
      },
      '/nrc/townships': {
        get: {
          tags: ['NRC'],
          summary: 'List NRC townships',
          description: 'Public reference endpoint (no auth).',
          responses: {
            '200': {
              description: 'Townships reference data',
            },
          },
        },
      },
      '/bff/login': {
        post: {
          tags: ['BFF'],
          summary: 'Mobile login (shaped response)',
          description:
            'Preferred mobile entry via api-gateway. Proxies auth and returns MobileLoginResponse.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Mobile-shaped login response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MobileLoginResponse' },
                },
              },
            },
          },
        },
      },
      '/bff/dashboard': {
        get: {
          tags: ['BFF'],
          summary: 'BFF dashboard aggregate',
          security: bearerAuth,
          responses: {
            '200': { description: 'Dashboard payload' },
            '502': { description: 'Upstream error' },
          },
        },
      },
    },
  };
}

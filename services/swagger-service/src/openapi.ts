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
      { name: 'Auth', description: 'Login, refresh, device binding' },
      { name: 'Users', description: 'Profile & dealer verification' },
      { name: 'Devices', description: 'IMEI check' },
      { name: 'Tax', description: 'Tax applications' },
      { name: 'Payments', description: 'Payment batches & history' },
      { name: 'Claims', description: 'Device ownership claims' },
      { name: 'Activities', description: 'User activity feed' },
      { name: 'NRC', description: 'NRC townships reference' },
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
          required: ['email', 'password', 'deviceFingerprint'],
          properties: {
            email: { type: 'string', format: 'email', example: 'maung@dealer.com' },
            password: { type: 'string', format: 'password', example: 'secret123' },
            deviceFingerprint: {
              type: 'string',
              example: 'demo-device-fingerprint-001',
            },
            deviceName: { type: 'string', example: 'Pixel 8' },
            platform: { type: 'string', enum: ['android', 'ios'], example: 'android' },
            appVersion: { type: 'string', example: '1.0.0' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'integer', example: 3600 },
            user: { $ref: '#/components/schemas/PublicUser' },
            deviceBinding: { $ref: '#/components/schemas/DeviceBinding' },
          },
        },
        PublicUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            phone: { type: 'string', nullable: true },
            fullName: { type: 'string' },
            address: { type: 'string', nullable: true },
            townshipId: { type: 'integer', nullable: true },
            businessName: { type: 'string', nullable: true },
            tin: { type: 'string', nullable: true },
            businessRegistrationNo: { type: 'string', nullable: true },
            dealerVerified: { type: 'boolean' },
          },
        },
        DeviceBinding: {
          type: 'object',
          properties: {
            bound: { type: 'boolean' },
            deviceFingerprint: { type: 'string' },
            deviceName: { type: 'string', nullable: true },
            platform: { type: 'string', enum: ['android', 'ios'] },
            boundAt: { type: 'string', format: 'date-time' },
            appVersion: { type: 'string', nullable: true },
            lastSeenAt: { type: 'string', format: 'date-time' },
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
          description: 'Authenticate and bind/verify device fingerprint.',
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
              description: 'Tokens + user + device binding',
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
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'New tokens',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                      tokenType: { type: 'string' },
                      expiresIn: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
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
                  required: ['deviceFingerprint'],
                  properties: {
                    deviceFingerprint: { type: 'string' },
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
              description: 'Profile + device binding',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PublicUser' },
                      {
                        type: 'object',
                        properties: {
                          deviceBinding: {
                            allOf: [
                              { $ref: '#/components/schemas/DeviceBinding' },
                              { type: 'object', nullable: true },
                            ],
                          },
                        },
                      },
                    ],
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
      '/dealer/verify': {
        post: {
          tags: ['Users'],
          summary: 'Verify dealer (IRD)',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['businessRegistrationNo', 'tin'],
                  properties: {
                    businessRegistrationNo: { type: 'string', example: 'BRN-123456' },
                    tin: { type: 'string', example: 'TIN-998877' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      dealerVerified: { type: 'boolean' },
                      businessName: { type: 'string' },
                      tin: { type: 'string' },
                      businessRegistrationNo: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '403': {
              description: 'Dealer not verified',
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
                  required: ['tin', 'businessRegistrationNo', 'items'],
                  properties: {
                    tin: { type: 'string' },
                    businessRegistrationNo: { type: 'string' },
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
            '403': {
              description: 'Dealer not verified',
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
                      example: 'kbzpay',
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
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: [
                    'fullName',
                    'nrcNumber',
                    'phone',
                    'address',
                    'townshipId',
                    'imei1',
                  ],
                  properties: {
                    fullName: { type: 'string', example: 'Maung Maung' },
                    nrcNumber: { type: 'string', example: '12/ABC(N)123456' },
                    phone: { type: 'string', example: '09123456789' },
                    address: { type: 'string' },
                    townshipId: { type: 'integer', example: 1 },
                    imei1: { type: 'string', example: '359876543210108' },
                    imei2: { type: 'string', nullable: true },
                    nrcFrontUrl: { type: 'string' },
                    nrcBackUrl: { type: 'string' },
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
          summary: 'BFF login (proxied)',
          description: 'Same payload as `/login`; aggregated via BFF.',
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
              description: 'Login response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
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
          responses: {
            '200': { description: 'Dashboard payload' },
            '502': { description: 'Upstream error' },
          },
        },
      },
    },
  };
}

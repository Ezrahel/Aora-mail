export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Aora Business Email API',
    version: '1.0.0',
    description: 'Orchestration layer abstracting MXroute, Cloudflare and Paystack. All provider credentials stay server-side.',
  },
  servers: [
    { url: 'http://localhost:4000/api/v1', description: 'Local' },
    { url: 'https://api.aora.ng/api/v1', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'aora_session', description: 'Secure httpOnly cookie' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'DOMAIN_NOT_VERIFIED' },
              message: { type: 'string' },
              fieldErrors: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'businessName', 'email', 'password', 'acceptTerms'],
                properties: {
                  name: { type: 'string' },
                  businessName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  acceptTerms: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '409': { description: 'Email taken' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        security: [],
        responses: { '200': { description: 'OK' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/plans': {
      get: { summary: 'List plans', tags: ['Plans'], security: [], responses: { '200': { description: 'OK' } } },
    },
    '/domains': {
      get: {
        summary: 'List domains',
        tags: ['Domains'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated' } },
      },
      post: {
        summary: 'Create domain',
        tags: ['Domains'],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/domains/{id}/verify': {
      post: { summary: 'Verify domain DNS', tags: ['Domains'], responses: { '200': { description: 'Verified' } } },
    },
    '/mailboxes': {
      get: { summary: 'List mailboxes', tags: ['Mailboxes'], responses: { '200': { description: 'OK' } } },
      post: { summary: 'Create mailbox', tags: ['Mailboxes'], responses: { '201': { description: 'Created' } } },
    },
    '/webhooks/paystack': {
      post: {
        summary: 'Paystack webhook',
        tags: ['Webhooks'],
        security: [],
        responses: { '200': { description: 'Idempotent OK' } },
      },
    },
    '/health': {
      get: { summary: 'Health', tags: ['Health'], security: [] },
    },
  },
} as const;

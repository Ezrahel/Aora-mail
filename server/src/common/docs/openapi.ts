export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'Aora Business Email API', version: '1.0.0', description: 'Orchestration layer abstracting MXroute and other email providers.' },
  servers: [{ url: 'http://localhost:4000/api/v1', description: 'Local' }],
  paths: {
    '/auth/register': { post: { summary: 'Register', tags: ['Auth'] as string[] } },
    '/auth/login': { post: { summary: 'Login', tags: ['Auth'] as string[] } },
    '/plans': { get: { summary: 'List plans', tags: ['Plans'] as string[] } },
    '/domains': { get: { summary: 'List domains', tags: ['Domains'] as string[] } },
    '/mailboxes': { get: { summary: 'List mailboxes', tags: ['Mailboxes'] as string[] } },
    '/webhooks/paystack': { post: { summary: 'Paystack webhook', tags: ['Webhooks'] as string[] } },
  },
} as const;

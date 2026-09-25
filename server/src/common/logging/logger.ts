import pino from 'pino';
import { env } from '../../config/env';

export const logger = pino({
  level: env.LOG_LEVEL ?? 'info',
  transport: env.isDevelopment ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  base: { service: 'aora-server' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'apiKey', 'PAYSTACK_SECRET_KEY', 'MXROUTE_API_KEY'],
    remove: true,
  },
});

import pino from 'pino';
import { env } from '../../config/env';

// Pretty output is optional. It is a developer convenience, not a runtime
// dependency: production and fresh installs must still be able to start.
let transport: pino.TransportSingleOptions | undefined;
if (env.isDevelopment) {
  try {
    require.resolve('pino-pretty');
    transport = { target: 'pino-pretty', options: { colorize: true } };
  } catch {
    // pino's structured JSON output remains useful without pino-pretty.
  }
}

export const logger = pino({
  level: env.LOG_LEVEL ?? 'info',
  transport,
  base: { service: 'aora-server' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'apiKey', 'PAYSTACK_SECRET_KEY', 'MXROUTE_API_KEY'],
    remove: true,
  },
});

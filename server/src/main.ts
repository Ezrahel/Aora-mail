import { createApp } from './app';
import { env } from './config/env';
import { logger } from './common/logging/logger';
import { prisma } from './lib/prisma';
import { syncAllUsage } from './modules/usage/usage.service';

async function main(): Promise<void> {
  const app = createApp();

  // Graceful: ensure DB reachable at startup (don't crash if no DB in dev demo)
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.warn({ err }, 'Database connection failed — server will respond 503 on readiness, but HTTP will still start (demo mode)');
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, `Aora server listening on http://localhost:${env.PORT}`);
    logger.info(`Health: http://localhost:${env.PORT}/health`);
    logger.info(`API: http://localhost:${env.PORT}${env.API_PREFIX}/v1/plans`);
  });

  // Scheduled usage sync every 30 minutes
  const interval = setInterval(() => {
    syncAllUsage().catch((err) => logger.warn({ err }, 'Scheduled usage sync error'));
  }, 30 * 60 * 1000);
  // Allow process to exit
  if (interval.unref) interval.unref();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    clearInterval(interval);
    server.close(async () => {
      try { await prisma.$disconnect(); } catch {}
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

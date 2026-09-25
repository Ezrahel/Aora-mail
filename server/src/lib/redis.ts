import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../common/logging/logger';

let redis: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (!env.REDIS_URL) return null;
  if (redis) return redis;
  try {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    redis.on('error', (err: Error) => {
      logger.warn({ err: err.message }, 'Redis error (non-fatal)');
    });
    // Don't block startup; connect lazily
    redis.connect().catch(() => {
      logger.warn('Redis unavailable — falling back to in-memory');
    });
    return redis;
  } catch (err) {
    logger.warn({ err }, 'Failed to init Redis');
    return null;
  }
}

export async function isRedisReady(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

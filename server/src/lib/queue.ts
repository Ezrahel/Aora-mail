import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { getRedis } from './redis';
import { logger } from '../common/logging/logger';

export type QueueName = 'provisioning' | 'usage-sync' | 'email';

let queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue | null {
  const redis = getRedis();
  if (!redis) {
    // In-memory fallback: return null, caller should handle sync fallback
    return null;
  }
  if (queues.has(name)) return queues.get(name) ?? null;
  try {
    const queue = new Queue(name, { connection: redis as unknown as ConstructorParameters<typeof Queue>[1] });
    queues.set(name, queue);
    return queue;
  } catch (err) {
    logger.warn({ err, queue: name }, 'Failed to create queue');
    return null;
  }
}

export async function enqueue<T>(queueName: QueueName, jobName: string, data: T, opts?: JobsOptions): Promise<string | null> {
  const queue = getQueue(queueName);
  if (!queue) {
    logger.info({ queue: queueName, job: jobName }, 'Queue unavailable — job will be processed inline fallback');
    return null;
  }
  const job = await queue.add(jobName, data, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
    ...opts,
  });
  return job.id ?? null;
}

export function createWorker<T>(queueName: QueueName, processor: (job: { name: string; data: T }) => Promise<void>): Worker | null {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const worker = new Worker(queueName, async (job) => processor({ name: job.name, data: job.data as T }), {
      connection: redis as unknown as ConstructorParameters<typeof Worker>[1],
      concurrency: 5,
    });
    worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err: err.message, queue: queueName }, 'Job failed'));
    worker.on('completed', (job) => logger.info({ jobId: job.id, queue: queueName }, 'Job completed'));
    return worker;
  } catch (err) {
    logger.warn({ err, queue: queueName }, 'Failed to create worker');
    return null;
  }
}

export function getQueueEvents(name: QueueName): QueueEvents | null {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return new QueueEvents(name, { connection: redis as unknown as ConstructorParameters<typeof QueueEvents>[1] });
  } catch {
    return null;
  }
}

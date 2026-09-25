import { prisma } from '../../lib/prisma';
import { logger } from '../../common/logging/logger';
import { emailProvider } from '../../providers/email/mxroute/mxroute.provider';

export async function processProvisioningJob(jobId: string): Promise<void> {
  const job = await prisma.provisioningJob.findUnique({ where: { id: jobId } });
  if (!job) {
    logger.warn({ jobId }, 'Provisioning job not found');
    return;
  }
  if (job.status === 'completed' || job.status === 'cancelled') return;

  await prisma.provisioningJob.update({ where: { id: jobId }, data: { status: 'processing', attempts: { increment: 1 }, lockedAt: new Date() } });

  try {
    switch (job.type) {
      case 'create_domain': {
        const payload = job.payload as { domain: string };
        const result = await emailProvider.createDomain({ domain: payload.domain });
        if (job.domainId) {
          await prisma.domain.update({ where: { id: job.domainId }, data: { providerDomainId: result.id, status: 'dns_pending', verificationKey: result.verificationKey } });
        }
        break;
      }
      case 'create_mailbox': {
        const payload = job.payload as { domain: string; localPart: string; password?: string; quotaBytes?: number };
        // This path is used when enqueued via queue; direct mailbox creation already provisions inline
        break;
      }
      case 'verify_domain': {
        // Trigger domain verification
        const { verifyDomain } = await import('../domains/domains.service');
        if (job.domainId && job.organizationId) {
          await verifyDomain(job.domainId, job.organizationId, job.organizationId); // actor fallback
        }
        break;
      }
      default:
        logger.info({ type: job.type }, 'No handler for job type — marking completed');
    }

    await prisma.provisioningJob.update({ where: { id: jobId }, data: { status: 'completed', result: { success: true } as unknown as object } });
  } catch (err) {
    const attempts = job.attempts + 1;
    const max = job.maxAttempts;
    if (attempts >= max) {
      await prisma.provisioningJob.update({ where: { id: jobId }, data: { status: 'failed', error: String(err) } });
      logger.error({ jobId, err: String(err) }, 'Provisioning job failed permanently');
    } else {
      await prisma.provisioningJob.update({ where: { id: jobId }, data: { status: 'retrying', error: String(err) } });
      // Re-enqueue with backoff would happen via BullMQ; for now, simple retry
      logger.warn({ jobId, attempts }, 'Provisioning job retrying');
    }
  }
}

export async function listJobs(organizationId: string, opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.provisioningJob.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.provisioningJob.count({ where: { organizationId } }),
  ]);
  return { data, total };
}

export async function retryJob(jobId: string, organizationId: string): Promise<unknown> {
  const job = await prisma.provisioningJob.findFirst({ where: { id: jobId, organizationId } });
  if (!job) throw new Error('Job not found');
  await prisma.provisioningJob.update({ where: { id: jobId }, data: { status: 'queued', error: null } });
  // inline retry attempt
  processProvisioningJob(jobId).catch(() => {});
  return prisma.provisioningJob.findUnique({ where: { id: jobId } });
}

import { prisma } from '../../lib/prisma';
import { emailProvider } from '../../providers/email/mxroute/mxroute.provider';
import { logger } from '../../common/logging/logger';
import { env } from '../../config/env';

export async function syncUsage(organizationId: string): Promise<unknown> {
  // Fetch from provider, normalize, store snapshot — do NOT query provider on every dashboard load
  let usage;
  try {
    usage = await emailProvider.getUsage({});
  } catch (err) {
    logger.warn({ err, organizationId }, 'Provider usage fetch failed — using DB fallback');
    // Fallback to DB aggregates
    const mailboxes = await prisma.mailbox.findMany({ where: { organizationId } });
    const used = mailboxes.reduce((sum, m) => sum + Number(m.usedBytes), 0);
    const quota = mailboxes.reduce((sum, m) => sum + Number(m.quotaBytes), 0);
    usage = { totalQuotaBytes: quota, usedBytes: used, mailboxCount: mailboxes.length, mailboxes: mailboxes.map((m) => ({ id: m.id, email: m.email, usedBytes: Number(m.usedBytes), quotaBytes: Number(m.quotaBytes) })) };
  }

  // Store snapshot
  await prisma.usageSnapshot.create({
    data: {
      organizationId,
      usedBytes: BigInt(usage.usedBytes),
      quotaBytes: BigInt(usage.totalQuotaBytes),
      mailboxCount: usage.mailboxCount,
    },
  });

  // Update mailbox usedBytes from provider
  for (const m of usage.mailboxes) {
    const local = await prisma.mailbox.findFirst({ where: { email: m.email, organizationId } }).catch(() => null);
    if (local) {
      await prisma.mailbox.update({ where: { id: local.id }, data: { usedBytes: BigInt(m.usedBytes) } });
    }
  }

  // Check thresholds for alerting
  const percent = usage.totalQuotaBytes > 0 ? (usage.usedBytes / usage.totalQuotaBytes) * 100 : 0;
  if (percent >= env.USAGE_CRITICAL_THRESHOLD) {
    logger.error({ organizationId, percent }, 'Usage critical threshold reached');
  } else if (percent >= env.USAGE_WARNING_THRESHOLD) {
    logger.warn({ organizationId, percent }, 'Usage warning threshold reached');
  }

  return { usedBytes: usage.usedBytes, quotaBytes: usage.totalQuotaBytes, mailboxCount: usage.mailboxCount, percent: Math.round(percent) };
}

export async function getUsage(organizationId: string): Promise<unknown> {
  const latest = await prisma.usageSnapshot.findFirst({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  const mailboxes = await prisma.mailbox.findMany({ where: { organizationId } });
  const used = latest ? Number(latest.usedBytes) : mailboxes.reduce((sum, m) => sum + Number(m.usedBytes), 0);
  const quota = latest ? Number(latest.quotaBytes) : mailboxes.reduce((sum, m) => sum + Number(m.quotaBytes), 0) || 5 * 1024 * 1024 * 1024;
  return {
    usedBytes: used,
    quotaBytes: quota,
    allocatedQuotaBytes: quota,
    actualUsedBytes: used,
    mailboxCount: latest?.mailboxCount ?? mailboxes.length,
    mailboxes: mailboxes.map((m) => ({ id: m.id, email: m.email, usedBytes: Number(m.usedBytes), quotaBytes: Number(m.quotaBytes) })),
    lastSyncedAt: latest?.createdAt.toISOString() ?? null,
  };
}

// Scheduled job: every 30 minutes sync all organizations
export async function syncAllUsage(): Promise<void> {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  for (const org of orgs) {
    await syncUsage(org.id).catch((err) => logger.warn({ err, organizationId: org.id }, 'Scheduled usage sync failed'));
  }
}

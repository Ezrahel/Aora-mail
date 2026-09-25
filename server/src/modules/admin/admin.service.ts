import { prisma } from '../../lib/prisma';

export async function getMetrics(): Promise<unknown> {
  const [orgCount, payingOrgs, mailboxCount, domainCount, failedPayments, failedJobs] = await Promise.all([
    prisma.organization.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.mailbox.count(),
    prisma.domain.count(),
    prisma.payment.count({ where: { status: 'failed' } }),
    prisma.provisioningJob.count({ where: { status: 'failed' } }),
  ]);

  const totalRevenueKobo = await prisma.invoice.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
  const mrrKobo = await prisma.subscription.findMany({ where: { status: 'active' }, include: { plan: true } }).then((subs) => subs.reduce((sum, s) => sum + s.plan.annualPrice / 12, 0));

  return {
    registeredOrganizations: orgCount,
    payingOrganizations: payingOrgs,
    mrrKobo: Math.round(mrrKobo),
    mrrNgn: Math.round(mrrKobo / 100),
    arrNgn: Math.round((mrrKobo * 12) / 100),
    totalRevenueNgn: (totalRevenueKobo._sum.amount ?? 0) / 100,
    mailboxCount,
    domainCount,
    averageMailboxesPerOrg: orgCount ? Number((mailboxCount / orgCount).toFixed(2)) : 0,
    failedPayments,
    failedProvisioningJobs: failedJobs,
  };
}

export async function listOrganizations(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.organization.findMany({ include: { domains: true, mailboxes: true, subscriptions: { include: { plan: true } } }, skip: (opts.page - 1) * opts.limit, take: opts.limit, orderBy: { createdAt: 'desc' } }),
    prisma.organization.count(),
  ]);
  return { data, total };
}

export async function listProvisioningJobs(opts: { page: number; limit: number; status?: string }): Promise<{ data: unknown[]; total: number }> {
  const where = opts.status ? { status: opts.status as unknown as import('@prisma/client').ProvisioningJobStatus } : {};
  const [data, total] = await Promise.all([
    prisma.provisioningJob.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.provisioningJob.count({ where }),
  ]);
  return { data, total };
}

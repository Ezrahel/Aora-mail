import { prisma } from '../../lib/prisma';

export async function getMetrics(): Promise<unknown> {
  const [
    orgCount,
    payingOrgs,
    mailboxCount,
    domainCount,
    failedPayments,
    failedJobs,
    totalStorage,
    verifiedDomains,
    usersCount,
    invoicesPaid,
    subsCancelled,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.mailbox.count(),
    prisma.domain.count(),
    prisma.payment.count({ where: { status: 'failed' } }),
    prisma.provisioningJob.count({ where: { status: 'failed' } }),
    prisma.mailbox.aggregate({ _sum: { usedBytes: true, quotaBytes: true } }),
    prisma.domain.count({ where: { status: { in: ['verified', 'active'] } }),
    prisma.user.count(),
    prisma.invoice.count({ where: { status: 'paid' } }),
    prisma.subscription.count({ where: { status: 'cancelled' } }),
  ]);

  const totalRevenueKobo = await prisma.invoice.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
  const mrrKobo = await prisma.subscription.findMany({ where: { status: 'active' }, include: { plan: true } }).then((subs) => subs.reduce((sum, s) => sum + s.plan.annualPrice / 12, 0));

  const storageUsed = Number(totalStorage._sum.usedBytes ?? 0);
  const verificationRate = domainCount ? Number(((verifiedDomains / domainCount) * 100).toFixed(1)) : 0;
  const payingRate = orgCount ? Number(((payingOrgs / orgCount) * 100).toFixed(1)) : 0;
  const orgsWithMailbox = await prisma.organization.count({ where: { mailboxes: { some: {} } } });
  const paymentToMailboxConversion = payingOrgs ? Number(((orgsWithMailbox / payingOrgs) * 100).toFixed(1)) : 0;
  const avgRevenuePerOrg = orgCount ? Number((((totalRevenueKobo._sum.amount ?? 0) / 100 / orgCount).toFixed(2))) : 0;

  return {
    registeredOrganizations: orgCount,
    payingOrganizations: payingOrgs,
    mrrKobo: Math.round(mrrKobo),
    mrrNgn: Math.round(mrrKobo / 100),
    arrNgn: Math.round((mrrKobo * 12) / 100),
    totalRevenueNgn: (totalRevenueKobo._sum.amount ?? 0) / 100,
    averageRevenuePerOrganization: avgRevenuePerOrg,
    mailboxCount,
    domainCount,
    averageMailboxesPerOrg: orgCount ? Number((mailboxCount / orgCount).toFixed(2)) : 0,
    storageUsedBytes: storageUsed,
    storageUsedGb: Number((storageUsed / 1024 / 1024 / 1024).toFixed(2)),
    verificationCompletionRate: verificationRate,
    signupToPaymentConversion: payingRate,
    paymentToMailboxConversion,
    failedPayments,
    failedProvisioningJobs: failedJobs,
    totalUsers: usersCount,
    paidInvoices: invoicesPaid,
    churnedSubscriptions: subsCancelled,
    churnRate: orgCount ? Number(((subsCancelled / orgCount) * 100).toFixed(1)) : 0,
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

export async function listDomains(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.domain.findMany({ include: { organization: true }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.domain.count(),
  ]);
  return { data, total };
}

export async function listMailboxes(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.mailbox.findMany({ include: { domain: true, organization: true }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.mailbox.count(),
  ]);
  return { data, total };
}

export async function listCustomers(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.user.count(),
  ]);
  return { data, total };
}

export async function listPayments(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.payment.count(),
  ]);
  return { data, total };
}

export async function listSubscriptions(opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.subscription.findMany({ include: { plan: true, organization: true }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.subscription.count(),
  ]);
  return { data, total };
}

export async function getProviderHealth(): Promise<unknown> {
  const [mxRoute, cloudflare] = await Promise.all([
    prisma.providerAccount.count({ where: { provider: 'mxroute' } }).then(() => ({ provider: 'mxroute', status: 'ok' as const, lastCheck: new Date().toISOString() })).catch(() => ({ provider: 'mxroute', status: 'degraded' as const })),
    Promise.resolve({ provider: 'cloudflare', status: process.env.CLOUDFLARE_API_TOKEN ? ('ok' as const) : ('disabled' as const) }),
  ]);
  const recentFailures = await prisma.provisioningJob.count({ where: { status: 'failed', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  return { providers: [mxRoute, cloudflare], recentFailures24h: recentFailures };
}

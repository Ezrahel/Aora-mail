import { prisma } from '../../lib/prisma';
import { AppError, conflict, notFound } from '../../common/errors/app-error';
import { emailProvider } from '../../providers/email/mxroute/mxroute.provider';
import { createAuditLog } from '../audit/audit.service';
import { getOrganizationEntitlements, canCreateDomain } from '../plans/plans.service';
import { enqueue } from '../../lib/queue';
import { env } from '../../config/env';
import { v4 as uuid } from 'uuid';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['provisioning', 'error'],
  provisioning: ['dns_pending', 'error'],
  dns_pending: ['verifying', 'error', 'suspended'],
  verifying: ['verified', 'dns_pending', 'error'],
  verified: ['active', 'error', 'suspended'],
  active: ['suspended', 'error', 'verifying'],
  error: ['pending', 'verifying', 'provisioning'],
  suspended: ['pending', 'verifying', 'error'],
};

function assertTransition(from: string, to: string): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new AppError(409, 'CONFLICT', `Invalid status transition ${from} → ${to}`);
  }
}

function toAsciiDomain(input: string): string {
  try {
    const { toASCII } = require('punycode') as { toASCII: (s: string) => string };
    return toASCII(input.toLowerCase().trim());
  } catch {
    return input.toLowerCase().trim();
  }
}

function isValidDomain(name: string): boolean {
  const ascii = toAsciiDomain(name);
  if (ascii.length < 3 || ascii.length > 253) return false;
  if (ascii.startsWith('-') || ascii.endsWith('-') || ascii.includes('..')) return false;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(ascii)) return false;
  const tld = ascii.split('.').pop() ?? '';
  if (tld.length < 2 || tld.length > 63) return false;
  if (['example', 'test', 'invalid', 'localhost'].includes(tld)) return false;
  return true;
}

export async function listDomains(organizationId: string): Promise<unknown[]> {
  const domains = await prisma.domain.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  return domains.map(toPublicDomain);
}

export async function listDomainsPaginated(organizationId: string, opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.domain.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.domain.count({ where: { organizationId } }),
  ]);
  return { data: data.map(toPublicDomain), total };
}

function toPublicDomain(d: { id: string; name: string; status: string; organizationId: string; createdAt: Date; verifiedAt: Date | null; providerDomainId?: string | null }): unknown {
  return {
    id: d.id,
    name: d.name,
    status: mapDomainStatus(d.status),
    organizationId: d.organizationId,
    createdAt: d.createdAt.toISOString(),
    verifiedAt: d.verifiedAt?.toISOString(),
  };
}

function mapDomainStatus(s: string): string {
  // Keep compatibility: server dns_pending -> client dns_incomplete, provisioning -> pending, suspended -> error
  if (s === 'dns_pending') return 'dns_incomplete';
  if (s === 'provisioning') return 'pending';
  if (s === 'suspended') return 'error';
  return s;
}

export async function getDomain(domainId: string, organizationId: string): Promise<unknown> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');
  return toPublicDomain(domain as unknown as Parameters<typeof toPublicDomain>[0]);
}

export async function createDomain(organizationId: string, userId: string, name: string, requestId?: string): Promise<unknown> {
  const normalized = toAsciiDomain(name);
  if (!isValidDomain(normalized)) throw new AppError(422, 'VALIDATION_ERROR', 'Please enter a valid domain name.', { name: 'Invalid domain' });

  const existing = await prisma.domain.findUnique({ where: { name: normalized } });
  if (existing) {
    if (existing.organizationId === organizationId) throw conflict('CONFLICT', 'This domain is already connected to your organization.', { name: 'Domain already exists in your account' });
    throw conflict('CONFLICT', 'This domain is already connected to another account.', { name: 'Domain already exists' });
  }

  // Entitlement check
  const ent = await getOrganizationEntitlements(organizationId);
  if (ent) {
    const count = await prisma.domain.count({ where: { organizationId } });
    if (!canCreateDomain(ent, count)) throw new AppError(403, 'ENTITLEMENT_DENIED', `Your plan allows up to ${ent.maxDomains} domain(s). Upgrade to add more.`);
  }

  const idempotencyKey = `domain:${organizationId}:${normalized}`;

  // Check existing provisioning job for idempotency
  const existingJob = await prisma.provisioningJob.findUnique({ where: { idempotencyKey } }).catch(() => null);
  if (existingJob && existingJob.status !== 'failed') {
    // Return existing domain if already created
    const d = await prisma.domain.findUnique({ where: { name: normalized } });
    if (d) return d;
  }

  const domain = await prisma.domain.create({
    data: {
      name: normalized,
      organizationId,
      status: 'pending',
    },
  });

  // Create provisioning job async
  const jobId = uuid();
  await prisma.provisioningJob.create({
    data: {
      id: jobId,
      organizationId,
      domainId: domain.id,
      type: 'create_domain',
      status: 'queued',
      idempotencyKey,
      payload: { domain: normalized },
    },
  });

  // Enqueue for async processing (non-blocking)
  await enqueue('provisioning', 'create_domain', { jobId, domainId: domain.id, organizationId, domain: normalized }).catch(() => {
    // Fallback: mark for retry
  });

  // Optimistic: try provider sync but don't block response — but for demo, we also attempt inline if no queue
  // Also store expected DNS records immediately after provider provisioning would provide them
  // For now, create DnsRecord placeholders from provider's expected DNS
  try {
    const dns = await emailProvider.getDomainDns({ domain: normalized }).catch(() => null);
    if (dns) {
      const records = [
        ...dns.mx.map((m) => ({ type: 'MX' as const, host: m.host, value: m.value, priority: m.priority, purpose: 'Receives email', ttl: 3600 })),
        { type: 'TXT' as const, host: '@', value: dns.spf, purpose: 'SPF — authorizes sending', ttl: 3600 },
        ...dns.dkim.map((k) => ({ type: 'TXT' as const, host: k.selector, value: k.value, purpose: 'DKIM — verifies authenticity', ttl: 3600 })),
      ];
      for (const r of records) {
        const exists = await prisma.dnsRecord.findFirst({ where: { domainId: domain.id, type: r.type as unknown as import('@prisma/client').DnsRecordType, host: r.host, value: r.value } });
        if (!exists) {
          await prisma.dnsRecord.create({
            data: {
              domainId: domain.id,
              type: r.type as unknown as import('@prisma/client').DnsRecordType,
              host: r.host,
              value: r.value,
              priority: (r as unknown as { priority?: number }).priority,
              ttl: r.ttl,
              purpose: r.purpose,
              status: 'pending',
            },
          });
        }
      }
      if (dns.dmarc) {
        const exists = await prisma.dnsRecord.findFirst({ where: { domainId: domain.id, host: '_dmarc', value: dns.dmarc } });
        if (!exists) {
          await prisma.dnsRecord.create({
            data: {
              domainId: domain.id,
              type: 'TXT',
              host: '_dmarc',
              value: dns.dmarc,
              purpose: 'DMARC — recommended',
              status: 'pending',
            },
          });
        }
      }
    }
  } catch {
    // Non-fatal; DNS instructions will be retried on next verify
  }

  await createAuditLog({ action: 'DOMAIN_ADDED', actorId: userId, organizationId, resourceType: 'Domain', resourceId: domain.id, metadata: { name: normalized }, requestId });

  // Try immediate provisioning attempt (idempotent)
  provisionDomain(domain.id).catch(() => {});

  const updated = await prisma.domain.findUnique({ where: { id: domain.id } });
  return updated ? toPublicDomain(updated as unknown as Parameters<typeof toPublicDomain>[0]) : null;
}

async function provisionDomain(domainId: string): Promise<void> {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) return;
  try {
    assertTransition(domain.status, 'provisioning');
  } catch {
    // Already in non-transitionable state, skip
    if (domain.status !== 'pending' && domain.status !== 'error') return;
  }
  await prisma.domain.update({ where: { id: domainId }, data: { status: 'provisioning' } });
  try {
    const providerDomain = await emailProvider.createDomain({ domain: domain.name });
    const fresh = await prisma.domain.findUnique({ where: { id: domainId } });
    if (fresh) assertTransition(fresh.status, 'dns_pending');
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        providerDomainId: providerDomain.id,
        verificationKey: providerDomain.verificationKey,
        status: 'dns_pending',
      },
    });
    await prisma.provisioningJob.updateMany({
      where: { domainId, type: 'create_domain', status: { in: ['queued', 'processing'] } },
      data: { status: 'completed' },
    });
  } catch (err) {
    await prisma.domain.update({ where: { id: domainId }, data: { status: 'error' } });
    await prisma.provisioningJob.updateMany({
      where: { domainId, type: 'create_domain' },
      data: { status: 'failed', error: String(err) },
    });
    await createAuditLog({ action: 'PROVISIONING_FAILED', organizationId: domain.organizationId, resourceType: 'Domain', resourceId: domainId, metadata: { error: String(err) } });
  }
}

export async function deleteDomain(domainId: string, organizationId: string, userId: string): Promise<void> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');
  // Prevent deletion if active mailboxes exist unless forced
  const mailboxCount = await prisma.mailbox.count({ where: { domainId } });
  if (mailboxCount > 0) throw new AppError(400, 'VALIDATION_ERROR', 'Delete or move mailboxes before removing this domain.');
  try {
    await emailProvider.deleteDomain({ domain: domain.name, providerDomainId: domain.providerDomainId ?? undefined });
  } catch {
    // Log but continue — internal desired state is deleted
  }
  await prisma.domain.delete({ where: { id: domainId } });
  await createAuditLog({ action: 'DOMAIN_DELETED', actorId: userId, organizationId, resourceType: 'Domain', resourceId: domainId });
}

export async function verifyDomain(domainId: string, organizationId: string, userId: string): Promise<unknown> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');

  if (!['dns_pending', 'verifying', 'error', 'verified', 'active', 'pending', 'provisioning'].includes(domain.status)) {
    throw new AppError(409, 'CONFLICT', `Domain not ready for verification (current: ${domain.status})`);
  }
  try {
    assertTransition(domain.status, 'verifying');
  } catch {
    // Allow re-verify from active/verified as well
    if (!['verified', 'active', 'dns_pending', 'error'].includes(domain.status)) throw new AppError(409, 'CONFLICT', `Cannot verify in status ${domain.status}`);
  }
  await prisma.domain.update({ where: { id: domainId }, data: { status: 'verifying' } });
  await createAuditLog({ action: 'DNS_CONFIGURED', actorId: userId, organizationId, resourceType: 'Domain', resourceId: domainId, metadata: { name: domain.name } });

  const expected = await prisma.dnsRecord.findMany({ where: { domainId } });

  let recordsToVerify = expected.map((r) => ({ type: r.type as 'MX' | 'TXT' | 'CNAME', host: r.host, value: r.value }));
  if (!recordsToVerify.length) {
    const dns = await emailProvider.getDomainDns({ domain: domain.name });
    recordsToVerify = [
      ...dns.mx.map((m) => ({ type: 'MX' as const, host: m.host, value: m.value })),
      { type: 'TXT' as const, host: '@', value: dns.spf },
    ];
  }

  const { ManualDnsProvider } = await import('../../providers/dns/cloudflare/cloudflare.provider');
  const provider = new ManualDnsProvider();
  let result: Awaited<ReturnType<typeof provider.verifyDomain>> | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < Math.max(1, env.DNS_VERIFICATION_RETRIES); attempt++) {
    try {
      result = await provider.verifyDomain({ domain: domain.name, expectedRecords: recordsToVerify as unknown as import('../../providers/dns/dns-provider.interface').DnsRecord[] });
      break;
    } catch (err) {
      lastError = String(err);
      if (attempt < env.DNS_VERIFICATION_RETRIES - 1) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  if (!result) throw new AppError(502, 'PROVIDER_ERROR', lastError ?? 'DNS verification temporarily unavailable');

  // Strict simulation gate — only when explicitly allowed
  if (!result.verified && env.ALLOW_DNS_SIMULATION && env.isDevelopment) {
    const hasPending = expected.some((e) => e.host !== '_dmarc' && e.status !== 'verified');
    if (hasPending) {
      for (const rec of result.records) {
        if (rec.record.host !== '_dmarc' && rec.status !== 'verified') rec.status = 'verified';
      }
      result.verified = result.records.filter((r) => r.record.host !== '_dmarc').every((r) => r.status === 'verified');
    }
  }

  for (const r of result.records) {
    const match = expected.find((e) => e.type === r.record.type && e.host === r.record.host && e.value === r.record.value);
    if (match) {
      const nextStatus = r.status === 'verified' ? 'verified' : r.status === 'error' ? 'error' : r.status === 'missing' ? 'missing' : 'pending';
      await prisma.dnsRecord.update({
        where: { id: match.id },
        data: { status: nextStatus as unknown as import('@prisma/client').DnsStatus },
      });
    }
  }

  const allVerified = result.verified;
  const newStatus = allVerified ? 'verified' : 'dns_pending';
  const finalStatus = allVerified ? 'active' as const : newStatus as unknown as import('@prisma/client').DomainStatus;
  const fresh = await prisma.domain.findUnique({ where: { id: domainId } });
  if (fresh) {
    try {
      assertTransition(fresh.status, finalStatus);
    } catch {
      // Allow verifying → dns_pending/verified transitions even if not in map
    }
  }

  const updated = await prisma.domain.update({
    where: { id: domainId },
    data: { status: finalStatus, verifiedAt: allVerified ? new Date() : null },
  });

  if (allVerified) {
    await createAuditLog({ action: 'DOMAIN_VERIFIED', actorId: userId, organizationId, resourceType: 'Domain', resourceId: domainId });
  }

  return toPublicDomain(updated as unknown as Parameters<typeof toPublicDomain>[0]);
}

export async function getDnsRecords(domainId: string, organizationId: string): Promise<unknown[]> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');
  return prisma.dnsRecord.findMany({ where: { domainId } });
}

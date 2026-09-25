import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../common/errors/app-error';
import { emailProvider } from '../../providers/email/mxroute/mxroute.provider';
import { getOrganizationEntitlements, calculateQuotaBytes } from '../plans/plans.service';
import { createAuditLog } from '../audit/audit.service';
import { v4 as uuid } from 'uuid';
import { enqueue } from '../../lib/queue';

function validateLocalPart(localPart: string): void {
  if (!/^[a-z0-9._-]+$/i.test(localPart) || localPart.length < 1 || localPart.length > 64) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Local part contains invalid characters.', { localPart: 'Invalid mailbox name' });
  }
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Invalid mailbox name.', { localPart: 'Invalid format' });
  }
}

export async function listMailboxes(organizationId: string, opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.mailbox.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit, include: { domain: true } }),
    prisma.mailbox.count({ where: { organizationId } }),
  ]);
  const mapped = data.map(toPublicMailbox);
  return { data: mapped, total };
}

export async function listMailboxesUnpaginated(organizationId: string): Promise<unknown[]> {
  const data = await prisma.mailbox.findMany({ where: { organizationId }, include: { domain: true } });
  return data.map(toPublicMailbox);
}

export async function getMailbox(id: string, organizationId: string): Promise<unknown> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId }, include: { domain: true } });
  if (!mailbox) throw notFound('Mailbox not found.');
  return toPublicMailbox(mailbox);
}

export async function getConnectionDetails(id: string, organizationId: string): Promise<unknown> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId } });
  if (!mailbox) throw notFound('Mailbox not found.');
  return {
    webmailUrl: 'https://webmail.aora.ng',
    imap: { host: 'imap.aora.ng', port: 993, encryption: 'SSL/TLS' },
    smtp: { host: 'smtp.aora.ng', port: 587, encryption: 'STARTTLS' },
    username: mailbox.email,
  };
}

export async function createMailbox(organizationId: string, userId: string, input: { localPart: string; domainId: string; password?: string; quotaBytes?: number; idempotencyKey?: string }, requestId?: string): Promise<unknown> {
  validateLocalPart(input.localPart);

  const domain = await prisma.domain.findFirst({ where: { id: input.domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');
  if (!['verified', 'active'].includes(domain.status)) {
    throw new AppError(400, 'DOMAIN_NOT_VERIFIED', 'Verify your domain before creating a mailbox.', { domainId: 'DNS not verified' });
  }

  const email = `${input.localPart.toLowerCase()}@${domain.name}`;
  const existing = await prisma.mailbox.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'CONFLICT', 'This mailbox already exists.', { localPart: 'Address already taken' });

  // Entitlement & limits
  const ent = await getOrganizationEntitlements(organizationId);
  if (!ent) throw new AppError(403, 'ENTITLEMENT_DENIED', 'No active subscription. Please choose a plan.');
  const currentCount = await prisma.mailbox.count({ where: { organizationId } });
  if (currentCount >= ent.maxMailboxes) {
    throw new AppError(403, 'MAILBOX_LIMIT_EXCEEDED', `Your ${ent.maxMailboxes} mailbox limit has been reached. Upgrade to add more.`);
  }

  // Quota must be calculated from plan, not trusted from browser
  const allowedQuotaBytes = calculateQuotaBytes(ent);
  // quotaBytes from input is ignored except to cap at plan quota; if no ent, use plan quota
  const quotaBytes = allowedQuotaBytes;

  const idempotencyKey = input.idempotencyKey ?? `mailbox:${organizationId}:${email}`;
  // Idempotency: if job exists with same key and completed, return existing
  const existingJob = await prisma.provisioningJob.findUnique({ where: { idempotencyKey } }).catch(() => null);
  if (existingJob && existingJob.mailboxId) {
    const existingMailbox = await prisma.mailbox.findUnique({ where: { id: existingJob.mailboxId }, include: { domain: true } });
    if (existingMailbox) return toPublicMailbox(existingMailbox);
  }

  // Generate secure password if not provided
  const password = input.password ?? generateSecurePassword();

  const mailbox = await prisma.mailbox.create({
    data: {
      organizationId,
      domainId: domain.id,
      email,
      localPart: input.localPart.toLowerCase(),
      quotaBytes: BigInt(quotaBytes),
      allocatedQuotaBytes: BigInt(quotaBytes),
      usedBytes: BigInt(0),
      status: 'pending',
    },
    include: { domain: true },
  });

  const jobId = uuid();
  await prisma.provisioningJob.create({
    data: {
      id: jobId,
      organizationId,
      domainId: domain.id,
      mailboxId: mailbox.id,
      type: 'create_mailbox',
      status: 'queued',
      idempotencyKey,
      payload: { email, domain: domain.name, localPart: input.localPart },
    },
  });

  await enqueue('provisioning', 'create_mailbox', { jobId, mailboxId: mailbox.id, organizationId, domain: domain.name, localPart: input.localPart, password, quotaBytes }).catch(() => {});

  // Attempt provisioning inline (idempotent)
  provisionMailbox(mailbox.id, domain.name, input.localPart, password, quotaBytes).catch(() => {});

  await createAuditLog({ action: 'MAILBOX_CREATED', actorId: userId, organizationId, resourceType: 'Mailbox', resourceId: mailbox.id, metadata: { email }, requestId });

  const created = await prisma.mailbox.findUnique({ where: { id: mailbox.id }, include: { domain: true } });
  return toPublicMailbox(created!);
}

async function provisionMailbox(mailboxId: string, domain: string, localPart: string, password: string, quotaBytes: number): Promise<void> {
  await prisma.mailbox.update({ where: { id: mailboxId }, data: { status: 'pending' } });
  try {
    const providerMailbox = await emailProvider.createMailbox({ domain, localPart, password, quotaBytes, idempotencyKey: mailboxId });
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        providerMailboxId: providerMailbox.id,
        status: providerMailbox.status === 'active' ? 'active' : 'pending',
        usedBytes: BigInt(providerMailbox.usedBytes),
      },
    });
    await prisma.provisioningJob.updateMany({ where: { mailboxId, status: { in: ['queued', 'processing'] } }, data: { status: 'completed' } });
  } catch (err) {
    await prisma.mailbox.update({ where: { id: mailboxId }, data: { status: 'error' } });
    await prisma.provisioningJob.updateMany({ where: { mailboxId }, data: { status: 'failed', error: String(err) } });
    const m = await prisma.mailbox.findUnique({ where: { id: mailboxId } });
    if (m) await createAuditLog({ action: 'PROVISIONING_FAILED', organizationId: m.organizationId, resourceType: 'Mailbox', resourceId: mailboxId, metadata: { error: String(err) } });
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 16; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export async function deleteMailbox(id: string, organizationId: string, userId: string): Promise<void> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId } });
  if (!mailbox) throw notFound('Mailbox not found.');
  if (mailbox.providerMailboxId) {
    try {
      await emailProvider.deleteMailbox({ providerMailboxId: mailbox.providerMailboxId });
    } catch {
      // Continue — internal desired state is deleted
    }
  }
  await prisma.mailbox.delete({ where: { id } });
  await createAuditLog({ action: 'MAILBOX_DELETED', actorId: userId, organizationId, resourceType: 'Mailbox', resourceId: id });
}

export async function suspendMailbox(id: string, organizationId: string, userId: string): Promise<unknown> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId } });
  if (!mailbox) throw notFound('Mailbox not found.');
  if (mailbox.providerMailboxId) await emailProvider.suspendMailbox({ providerMailboxId: mailbox.providerMailboxId });
  const updated = await prisma.mailbox.update({ where: { id }, data: { status: 'suspended' } });
  await createAuditLog({ action: 'MAILBOX_SUSPENDED', actorId: userId, organizationId, resourceType: 'Mailbox', resourceId: id });
  return toPublicMailbox({ ...updated, domain: { name: updated.email.split('@')[1] } } as unknown as Parameters<typeof toPublicMailbox>[0]);
}

export async function unsuspendMailbox(id: string, organizationId: string, userId: string): Promise<unknown> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId } });
  if (!mailbox) throw notFound('Mailbox not found.');
  if (mailbox.providerMailboxId) await emailProvider.unsuspendMailbox({ providerMailboxId: mailbox.providerMailboxId });
  const updated = await prisma.mailbox.update({ where: { id }, data: { status: 'active' } });
  await createAuditLog({ action: 'MAILBOX_SUSPENDED', actorId: userId, organizationId, resourceType: 'Mailbox', resourceId: id, metadata: { unsuspend: true } });
  return toPublicMailbox({ ...updated, domain: { name: updated.email.split('@')[1] } } as unknown as Parameters<typeof toPublicMailbox>[0]);
}

export async function resetMailboxPassword(id: string, organizationId: string): Promise<{ temporaryPassword: string }> {
  const mailbox = await prisma.mailbox.findFirst({ where: { id, organizationId } });
  if (!mailbox) throw notFound('Mailbox not found.');
  const temporaryPassword = generateSecurePassword();
  if (mailbox.providerMailboxId) {
    await emailProvider.updateMailbox({ providerMailboxId: mailbox.providerMailboxId, password: temporaryPassword });
  }
  return { temporaryPassword };
}

function toPublicMailbox(m: { id: string; email: string; localPart: string; domainId: string; quotaBytes: bigint; usedBytes: bigint; status: string; createdAt: Date; domain?: { name: string } | null }): unknown {
  return {
    id: m.id,
    email: m.email,
    localPart: m.localPart,
    domainId: m.domainId,
    domainName: m.domain?.name ?? m.email.split('@')[1] ?? '',
    quotaBytes: Number(m.quotaBytes),
    usedBytes: Number(m.usedBytes),
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  };
}

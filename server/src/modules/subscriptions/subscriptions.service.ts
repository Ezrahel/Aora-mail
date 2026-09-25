import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../common/errors/app-error';
import { createAuditLog } from '../audit/audit.service';
import { env } from '../../config/env';
import { v4 as uuid } from 'uuid';

export async function getSubscription(organizationId: string): Promise<unknown | null> {
  const sub = await prisma.subscription.findFirst({ where: { organizationId }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
  if (!sub) return null;
  return toPublicSubscription(sub as unknown as Parameters<typeof toPublicSubscription>[0]);
}

export async function listInvoices(organizationId: string, opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    prisma.invoice.count({ where: { organizationId } }),
  ]);
  return { data: data.map(toPublicInvoice), total };
}

export async function selectPlan(organizationId: string, userId: string, planId: string): Promise<unknown> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound('Plan not found.');

  // Upsert subscription: if existing active, mark as pending change? For MVP, replace/create active for demo
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  // If mock / no paystack, activate immediately; otherwise would require payment flow
  const subscription = await prisma.subscription.create({
    data: {
      organizationId,
      planId: plan.id,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    include: { plan: true },
  });

  // Create paid invoice
  const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
  const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
  await prisma.invoice.create({
    data: {
      organizationId,
      subscriptionId: subscription.id,
      number: invoiceNumber,
      amount: plan.annualPrice,
      currency: 'NGN',
      status: 'paid',
      description: `${plan.name} plan — annual`,
      paidAt: now,
    },
  });

  await createAuditLog({ action: 'SUBSCRIPTION_CREATED', actorId: userId, organizationId, resourceType: 'Subscription', resourceId: subscription.id, metadata: { planId: plan.id } });
  await createAuditLog({ action: 'PLAN_CHANGED', actorId: userId, organizationId, metadata: { plan: plan.slug } });

  return toPublicSubscription(subscription as unknown as Parameters<typeof toPublicSubscription>[0]);
}

export async function initiatePaystackCheckout(organizationId: string, userId: string, planId: string): Promise<{ authorization_url: string; reference: string }> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound('Plan not found.');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found.');

  const reference = `aora_${organizationId.slice(0,8)}_${Date.now()}_${uuid().slice(0,6)}`;

  // Create pending payment
  await prisma.payment.create({
    data: {
      organizationId,
      amount: plan.annualPrice,
      currency: 'NGN',
      status: 'pending',
      provider: 'paystack',
      providerReference: reference,
      paystackReference: reference,
      idempotencyKey: reference,
      metadata: { planId: plan.id } as unknown as object,
    },
  });

  const { initializeTransaction } = await import('../payments/paystack.service');
  const result = await initializeTransaction({
    email: user.email,
    amountKobo: plan.annualPrice,
    reference,
    metadata: { organizationId, planId: plan.id, userId },
  });

  return { authorization_url: result.authorization_url, reference };
}

export async function cancelSubscription(organizationId: string, userId: string, immediate = false): Promise<unknown> {
  const sub = await prisma.subscription.findFirst({ where: { organizationId, status: { in: ['active', 'trialing', 'past_due'] } } });
  if (!sub) throw notFound('No active subscription to cancel.');
  if (immediate) {
    const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
    await createAuditLog({ action: 'SUBSCRIPTION_CANCELLED', actorId: userId, organizationId, resourceType: 'Subscription', resourceId: sub.id });
    return updated;
  }
  // End-of-period cancellation
  const graceEnd = sub.currentPeriodEnd ?? new Date(Date.now() + env.SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled', cancelledAt: new Date(), currentPeriodEnd: graceEnd } });
  await createAuditLog({ action: 'SUBSCRIPTION_CANCELLED', actorId: userId, organizationId, resourceType: 'Subscription', resourceId: sub.id, metadata: { endOfPeriod: graceEnd.toISOString() } });
  return updated;
}

export function toPublicSubscription(sub: { id: string; planId: string; status: string; currentPeriodEnd: Date | null; currentPeriodStart: Date | null; plan: { name: string; annualPrice: number } }): unknown {
  return {
    id: sub.id,
    planId: sub.planId,
    planName: sub.plan.name,
    status: sub.status,
    priceYearlyNgn: sub.plan.annualPrice / 100,
    billingInterval: 'yearly' as const,
    renewalDate: sub.currentPeriodEnd?.toISOString() ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: sub.status === 'active' ? 'paid' as const : 'pending' as const,
    currentPeriodStart: sub.currentPeriodStart?.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
  };
}

function toPublicInvoice(inv: { id: string; number: string; amount: number; status: string; createdAt: Date; paidAt: Date | null; description: string | null }): unknown {
  return {
    id: inv.id,
    number: inv.number,
    amountNgn: inv.amount / 100,
    amount: inv.amount,
    status: inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : 'failed',
    issuedAt: inv.createdAt.toISOString(),
    paidAt: inv.paidAt?.toISOString(),
    description: inv.description ?? '',
  };
}

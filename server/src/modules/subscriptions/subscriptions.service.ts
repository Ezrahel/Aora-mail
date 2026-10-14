import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../common/errors/app-error';
import { createAuditLog } from '../audit/audit.service';
import { v4 as uuid } from 'uuid';
import { amountForCurrency, createCheckout, type SupportedCurrency } from '../payments/bachs.service';

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

export async function selectPlan(organizationId: string, userId: string, planId: string): Promise<never> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound('Plan not found.');

  void organizationId; void userId; void plan;
  throw new AppError(409, 'PAYMENT_FAILED', 'Use checkout to activate or change a plan.');
}

export async function initiateBachsCheckout(organizationId: string, userId: string, planId: string, currency: SupportedCurrency): Promise<{ checkoutUrl: string; reference: string; currency: SupportedCurrency; amount: string }> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound('Plan not found.');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found.');

  const reference = `aora_${organizationId.slice(0,8)}_${Date.now()}_${uuid().slice(0,6)}`;
  const amount = amountForCurrency(plan.annualPrice, currency);
  const amountMinor = Math.round(Number(amount) * 100);

  const result = await createCheckout({ email: user.email, name: user.name, amount, currency, reference,
    metadata: { organizationId, planId: plan.id, userId }, idempotencyKey: `checkout:${reference}` });

  // Only persist a pending payment after Bachs has accepted the checkout.
  // This prevents abandoned records when credentials are absent or Bachs is
  // temporarily unavailable.
  await prisma.payment.create({
    data: {
      organizationId,
      amount: amountMinor,
      currency,
      status: 'pending',
      provider: 'bachs',
      providerReference: reference,
      paystackReference: reference,
      idempotencyKey: reference,
      metadata: { planId: plan.id } as unknown as object,
    },
  });
  return { checkoutUrl: result.checkoutUrl, reference, currency, amount };
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
  const graceEnd = sub.currentPeriodEnd ?? new Date(Date.now() + Number(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS ?? 7) * 24 * 60 * 60 * 1000);
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

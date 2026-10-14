import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { verifyWebhook } from '../payments/bachs.service';
import { createAuditLog } from '../audit/audit.service';

export const webhooksRouter = Router();

/** Bachs webhooks are the only authority for activating paid service. */
webhooksRouter.post('/bachs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? '';
    const signature = req.header('x-bachs-signature-v2') ?? req.header('x-bachs-signature');
    if (!verifyWebhook(rawBody, req.header('x-bachs-timestamp'), signature)) {
      res.status(401).json({ error: { code: 'WEBHOOK_SIGNATURE_INVALID', message: 'Invalid webhook signature.' } }); return;
    }
    const event = req.body as { id?: string; type?: string; data?: Record<string, unknown> };
    if (!event.id || !event.type) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed webhook.' } }); return; }
    const prior = await prisma.webhookEvent.findUnique({ where: { providerEventId: event.id } });
    if (prior?.processed) { res.status(200).json({ received: true, duplicate: true }); return; }
    await prisma.webhookEvent.upsert({ where: { providerEventId: event.id }, update: {}, create: { provider: 'bachs', providerEventId: event.id, eventType: event.type, payload: event as object } });
    const reference = String(event.data?.reference ?? event.data?.merchant_reference ?? '');
    const payment = reference ? await prisma.payment.findUnique({ where: { providerReference: reference } }) : null;
    if (event.type === 'collection.succeeded' && payment) {
      const amount = Math.round(Number(event.data?.settlement_amount ?? event.data?.amount ?? 0) * 100);
      if (String(event.data?.currency ?? payment.currency) !== payment.currency || amount !== payment.amount) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
        await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference, reason: 'amount_or_currency_mismatch' } });
      } else if (payment.status !== 'success') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'success', verified: true } });
        const planId = (payment.metadata as Record<string, unknown> | null)?.planId as string | undefined;
        const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
        if (plan) {
          const now = new Date(); const end = new Date(now); end.setFullYear(end.getFullYear() + 1);
          const existing = await prisma.subscription.findFirst({ where: { organizationId: payment.organizationId }, orderBy: { createdAt: 'desc' } });
          const subscription = existing ? await prisma.subscription.update({ where: { id: existing.id }, data: { planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: end, cancelledAt: null } }) : await prisma.subscription.create({ data: { organizationId: payment.organizationId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: end } });
          const count = await prisma.invoice.count({ where: { organizationId: payment.organizationId } });
          await prisma.invoice.create({ data: { organizationId: payment.organizationId, subscriptionId: subscription.id, number: `INV-${now.getFullYear()}-${String(count + 1).padStart(4, '0')}`, amount: payment.amount, currency: payment.currency, status: 'paid', description: `${plan.name} plan — annual`, paidAt: now } });
          await createAuditLog({ action: 'PAYMENT_COMPLETED', organizationId: payment.organizationId, metadata: { reference, planId, currency: payment.currency } });
        }
      }
    } else if ((event.type === 'collection.failed' || event.type === 'collection.underpaid') && payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference, event: event.type } });
    }
    await prisma.webhookEvent.update({ where: { providerEventId: event.id }, data: { processed: true } });
    res.status(200).json({ received: true });
  } catch (error) { next(error); }
});

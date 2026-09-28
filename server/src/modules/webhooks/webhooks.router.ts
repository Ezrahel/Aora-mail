import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { verifyWebhookSignature, verifyTransaction } from '../payments/paystack.service';
import { env } from '../../config/env';
import { logger } from '../../common/logging/logger';
import { createAuditLog } from '../audit/audit.service';

export const webhooksRouter = Router();

// Paystack sends JSON with x-paystack-signature — must verify before any state change
webhooksRouter.post('/paystack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body);

    if (!signature) {
      if (env.isProduction || env.PAYSTACK_WEBHOOK_SECRET) {
        res.status(401).json({ error: { code: 'WEBHOOK_SIGNATURE_INVALID', message: 'Missing webhook signature.' } });
        return;
      }
    } else if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: { code: 'WEBHOOK_SIGNATURE_INVALID', message: 'Invalid webhook signature.' } });
      return;
    }

    const event = req.body as { event: string; data: { reference: string; status: string; amount: number; id: number; metadata?: Record<string, unknown> } };
    const providerEventId = `${event.event}:${event.data.reference}:${event.data.id}`;
    const eventType = event.event;

    // Idempotency: store processed webhook event IDs
    const existing = await prisma.webhookEvent.findUnique({ where: { providerEventId } }).catch(() => null);
    if (existing?.processed) {
      logger.info({ providerEventId }, 'Webhook already processed — idempotent return');
      res.json({ received: true, duplicate: true });
      return;
    }

    await prisma.webhookEvent.upsert({
      where: { providerEventId },
      update: {},
      create: {
        provider: 'paystack',
        providerEventId,
        eventType,
        payload: event as unknown as object,
        processed: false,
      },
    });

    // Safe retries: verify transaction with Paystack (never trust webhook alone)
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const payment = await prisma.payment.findUnique({ where: { providerReference: reference } });
      if (!payment) {
        logger.warn({ reference, event: event.event }, 'Payment not found for webhook reference — ignoring but marking processed to avoid loop');
        await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });
        res.json({ received: true, matched: false });
        return;
      }

      let verification: Awaited<ReturnType<typeof verifyTransaction>> | null = null;
      try {
        verification = await verifyTransaction(reference);
      } catch (err) {
        logger.warn({ err, reference }, 'Paystack verification failed — will retry');
        res.json({ received: true, verified: false });
        return;
      }

      const isSuccess = verification.status === 'success';
      const isMock = !env.PAYSTACK_SECRET_KEY;
      // Active check: amount and currency must match payment record
      if (!isMock) {
        if (!isSuccess) {
          logger.warn({ reference, status: verification.status }, 'Paystack transaction not success — marking failed');
          await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
          await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });
          res.json({ received: true, verified: false });
          return;
        }
        if (verification.currency && verification.currency !== 'NGN') {
          logger.error({ reference, currency: verification.currency }, 'Currency mismatch — expected NGN');
          await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
          await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference, reason: 'currency_mismatch', currency: verification.currency } });
          await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });
          res.json({ received: true, verified: false });
          return;
        }
        // Allow small delta for kobo rounding, but require exact match to stored payment amount
        if (verification.amount !== payment.amount) {
          logger.error({ reference, expected: payment.amount, got: verification.amount }, 'Amount mismatch — potential tampering');
          // Do not activate subscription; mark failed
          await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
          await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference, reason: 'amount_mismatch', expected: payment.amount, got: verification.amount } });
          await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });
          res.json({ received: true, verified: false });
          return;
        }
        // Also check plan price if metadata has planId
        const metaPlanId = (payment.metadata as Record<string, unknown> | null)?.['planId'] as string | undefined;
        if (metaPlanId) {
          const plan = await prisma.plan.findUnique({ where: { id: metaPlanId } });
          if (plan && verification.amount !== plan.annualPrice) {
            logger.error({ reference, planId: metaPlanId, expected: plan.annualPrice, got: verification.amount }, 'Plan price mismatch');
            await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
            await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference, reason: 'plan_price_mismatch' } });
            await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });
            res.json({ received: true, verified: false });
            return;
          }
        }
      } else if (!isSuccess) {
        // Mock mode still requires success
        logger.warn({ reference }, 'Mock verification not success');
        res.json({ received: true, verified: false });
        return;
      }

      if (payment.status !== 'success') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'success', verified: true } });

          // If payment has plan metadata, activate subscription
          const metadata = payment.metadata as Record<string, unknown> | null;
          const planId = metadata?.['planId'] as string | undefined;
          const organizationId = payment.organizationId;

          if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: planId } });
            if (plan) {
              const existingSub = await prisma.subscription.findFirst({ where: { organizationId } });
              const now = new Date();
              const periodEnd = new Date(now);
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
              if (existingSub) {
                await prisma.subscription.update({ where: { id: existingSub.id }, data: { planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd } });
              } else {
                await prisma.subscription.create({ data: { organizationId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd } });
              }
              // Invoice
              const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
              await prisma.invoice.create({
                data: {
                  organizationId,
                  number: `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`,
                  amount: plan.annualPrice,
                  status: 'paid',
                  description: `${plan.name} plan — annual`,
                  paidAt: now,
                },
              });
              await createAuditLog({ action: 'PAYMENT_COMPLETED', organizationId, metadata: { reference, planId } });
              await createAuditLog({ action: 'SUBSCRIPTION_CREATED', organizationId, metadata: { planId } });
            }
          } else {
            await createAuditLog({ action: 'PAYMENT_COMPLETED', organizationId, metadata: { reference } });
          }
        }
      } else if (event.event === 'charge.failed' || event.event === 'charge.abandoned') {
      const reference = event.data.reference;
      const payment = await prisma.payment.findUnique({ where: { providerReference: reference } }).catch(() => null);
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
        await createAuditLog({ action: 'PAYMENT_FAILED', organizationId: payment.organizationId, metadata: { reference } });
      }
    }

    await prisma.webhookEvent.update({ where: { providerEventId }, data: { processed: true } });

    // Always respond 200 to prevent Paystack retries flooding, but event logging ensures safe retry
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

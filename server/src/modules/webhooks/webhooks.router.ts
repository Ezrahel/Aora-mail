import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { verifyWebhookSignature, verifyTransaction } from '../payments/paystack.service';
import { env } from '../../config/env';
import { logger } from '../../common/logging/logger';
import { createAuditLog } from '../audit/audit.service';

export const webhooksRouter = Router();

// Paystack sends JSON with x-paystack-signature
webhooksRouter.post('/paystack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body);

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
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
      let verified = false;
      try {
        const verification = await verifyTransaction(reference);
        verified = verification.status === 'success';
        if (!env.PAYSTACK_SECRET_KEY) verified = true; // mock mode
      } catch (err) {
        logger.warn({ err, reference }, 'Paystack verification failed — will retry');
        // Don't mark processed; allow retry
        res.json({ received: true, verified: false });
        return;
      }

      if (verified) {
        // Find payment
        const payment = await prisma.payment.findUnique({ where: { providerReference: reference } });
        if (payment && payment.status !== 'success') {
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
        } else if (!payment) {
          logger.warn({ reference }, 'Payment not found for webhook reference');
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

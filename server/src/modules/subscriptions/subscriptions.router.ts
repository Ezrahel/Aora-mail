import { Router, Request, Response, NextFunction } from 'express';
import * as subsService from './subscriptions.service';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import { paginationSchema } from '../../common/validation/schemas';

export const subscriptionsRouter = Router();
subscriptionsRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

subscriptionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await subsService.getSubscription(req.organizationId!);
    res.json({ data: sub, meta: {} });
  } catch (err) { next(err); }
});

// Frontend also calls /subscription (singular) — support both mounted paths
subscriptionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as { planId: string };
    if (!planId) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'planId is required.' } });
      return;
    }
    const sub = await subsService.selectPlan(req.organizationId!, req.user!.id, planId);
    res.status(201).json({ data: sub, message: 'Subscription activated.', meta: {} });
  } catch (err) { next(err); }
});

subscriptionsRouter.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as { planId: string };
    const result = await subsService.initiatePaystackCheckout(req.organizationId!, req.user!.id, planId);
    res.json({ data: result, meta: {} });
  } catch (err) { next(err); }
});

subscriptionsRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const immediate = req.query.immediate === 'true';
    const sub = await subsService.cancelSubscription(req.organizationId!, req.user!.id, immediate);
    res.json({ data: sub, meta: {} });
  } catch (err) { next(err); }
});

export const invoicesRouter = Router();
invoicesRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

invoicesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const wantsPagination = req.query.page !== undefined;
    const { prisma } = await import('../../lib/prisma');
    if (!wantsPagination) {
      // For billing/invoices list expected by frontend: return array
      const invoices = await prisma.invoice.findMany({ where: { organizationId: req.organizationId! }, orderBy: { createdAt: 'desc' } });
      const mapped = invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amountNgn: inv.amount / 100,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : 'failed',
        issuedAt: inv.createdAt.toISOString(),
        paidAt: inv.paidAt?.toISOString(),
        description: inv.description ?? '',
      }));
      res.json({ data: mapped, meta: {} });
      return;
    }
    const { data, total } = await subsService.listInvoices(req.organizationId!, { page, limit });
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

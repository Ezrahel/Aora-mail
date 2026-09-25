import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, loadUserMiddleware } from '../../common/middleware/auth';
import { prisma } from '../../lib/prisma';
import { paginationSchema } from '../../common/validation/schemas';
import * as subscriptionsService from '../subscriptions/subscriptions.service';

export const paymentsRouter = Router();
paymentsRouter.use(authMiddleware, loadUserMiddleware);

paymentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    if (!hasPagination) {
      const data = await prisma.payment.findMany({ where: { organizationId: req.organizationId! }, orderBy: { createdAt: 'desc' }, take: 20 });
      res.json({ data, meta: {} });
      return;
    }
    const [data, total] = await Promise.all([
      prisma.payment.findMany({ where: { organizationId: req.organizationId! }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.payment.count({ where: { organizationId: req.organizationId! } }),
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

paymentsRouter.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as { planId?: string };
    if (!planId) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'planId is required' } });
      return;
    }
    const result = await subscriptionsService.initiatePaystackCheckout(req.organizationId!, req.user!.id, planId);
    res.json({ data: result, meta: {} });
  } catch (err) { next(err); }
});

paymentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } });
    if (!payment) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found' } });
      return;
    }
    res.json({ data: payment, meta: {} });
  } catch (err) { next(err); }
});

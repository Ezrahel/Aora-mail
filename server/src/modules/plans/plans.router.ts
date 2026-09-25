import { Router, Request, Response, NextFunction } from 'express';
import * as plansService from './plans.service';

export const plansRouter = Router();

plansRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await plansService.listPlans();
    res.json({ data: plans, meta: {} });
  } catch (err) { next(err); }
});

plansRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await plansService.getPlanById(req.params.id);
    if (!plan) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Plan not found.' } });
      return;
    }
    res.json({ data: plan, meta: {} });
  } catch (err) { next(err); }
});

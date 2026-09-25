import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import * as usageService from './usage.service';

export const usageRouter = Router();
usageRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

usageRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usage = await usageService.getUsage(req.organizationId!);
    res.json({ data: usage, meta: {} });
  } catch (err) { next(err); }
});

usageRouter.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await usageService.syncUsage(req.organizationId!);
    res.json({ data: result, meta: {} });
  } catch (err) { next(err); }
});

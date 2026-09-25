import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import * as forwardersService from './forwarders.service';

export const forwardersRouter = Router();
forwardersRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

forwardersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domainId = req.query.domainId as string | undefined;
    const data = await forwardersService.listForwarders(req.organizationId!, domainId);
    res.json({ data, meta: {} });
  } catch (err) { next(err); }
});

forwardersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domainId, source, destination } = req.body as { domainId: string; source: string; destination: string };
    const fwd = await forwardersService.createForwarder(req.organizationId!, { domainId, source, destination });
    res.status(201).json({ data: fwd, meta: {} });
  } catch (err) { next(err); }
});

forwardersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forwardersService.deleteForwarder(req.params.id, req.organizationId!);
    res.json({ data: { success: true }, meta: {} });
  } catch (err) { next(err); }
});

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../common/errors/app-error';

export const dnsRouter = Router();
dnsRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

dnsRouter.get('/:domainId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = await prisma.domain.findFirst({ where: { id: req.params.domainId, organizationId: req.organizationId! } });
    if (!domain) throw notFound('Domain not found.');
    const records = await prisma.dnsRecord.findMany({ where: { domainId: domain.id } });
    res.json({ data: records, meta: {} });
  } catch (err) { next(err); }
});

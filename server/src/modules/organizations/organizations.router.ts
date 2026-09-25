import { Router, Request, Response, NextFunction } from 'express';
import * as orgService from './organizations.service';
import { authMiddleware, loadUserMiddleware } from '../../common/middleware/auth';

export const organizationsRouter = Router();
organizationsRouter.use(authMiddleware, loadUserMiddleware);

organizationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await orgService.listUserOrganizations(req.user!.id);
    res.json({ data: orgs, meta: {} });
  } catch (err) { next(err); }
});

organizationsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await orgService.getOrganization(req.params.id, req.user!.id);
    res.json({ data: org, meta: {} });
  } catch (err) { next(err); }
});

organizationsRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.user!.id, { name: req.body.name as string });
    res.json({ data: org, meta: {} });
  } catch (err) { next(err); }
});

organizationsRouter.patch('/current/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, businessName } = req.body as { name?: string; businessName?: string };
    const { prisma } = await import('../../lib/prisma');
    if (name) await prisma.user.update({ where: { id: req.user!.id }, data: { name } });
    let org = null;
    if (businessName && req.organizationId) {
      org = await prisma.organization.update({ where: { id: req.organizationId }, data: { name: businessName } });
    }
    // Return session shape for frontend compatibility
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const organization = req.organizationId ? await prisma.organization.findUnique({ where: { id: req.organizationId } }) : org;
    res.json({ data: { user: user ? { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified } : null, organization, token: (req.headers.authorization ?? '') }, meta: {} });
  } catch (err) { next(err); }
});

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, loadUserMiddleware } from '../../common/middleware/auth';
import { forbidden } from '../../common/errors/app-error';
import * as adminService from './admin.service';
import { paginationSchema } from '../../common/validation/schemas';

export const adminRouter = Router();

// Simple admin guard — in production use role table
function adminGuard(req: Request, _res: Response, next: NextFunction): void {
  // Allow if user email is admin@aora.ng or header x-admin-token matches env
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && req.headers['x-admin-token'] === adminToken) return next();
  if (req.user?.email === 'admin@aora.ng') return next();
  // Otherwise forbid — in dev, allow with warning
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  next(forbidden('Admin access required.'));
}

adminRouter.use(authMiddleware, loadUserMiddleware, adminGuard);

adminRouter.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await adminService.getMetrics();
    res.json({ data: metrics, meta: {} });
  } catch (err) { next(err); }
});

adminRouter.get('/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listOrganizations({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/provisioning-jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    const result = await adminService.listProvisioningJobs({ page, limit, status });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../lib/prisma');
    const { page, limit } = paginationSchema.parse(req.query);
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count(),
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/domains', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listDomains({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/mailboxes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listMailboxes({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listCustomers({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listPayments({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await adminService.listSubscriptions({ page, limit });
    res.json({ data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../lib/prisma');
    const snapshots = await prisma.usageSnapshot.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ data: snapshots, meta: {} });
  } catch (err) { next(err); }
});

adminRouter.get('/support-tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../lib/prisma');
    const { page, limit } = paginationSchema.parse(req.query);
    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.supportTicket.count(),
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

adminRouter.get('/provider-health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await adminService.getProviderHealth();
    res.json({ data: health, meta: {} });
  } catch (err) { next(err); }
});

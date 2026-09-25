import { Router, Request, Response, NextFunction } from 'express';
import * as mailboxesService from './mailboxes.service';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import { paginationSchema } from '../../common/validation/schemas';
import { z } from 'zod';

export const mailboxesRouter = Router();
mailboxesRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

mailboxesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    // Support both paginated and non-paginated (frontend expects array for dashboard)
    const wantsPagination = req.query.page !== undefined || req.query.limit !== undefined;
    if (!wantsPagination) {
      const data = await mailboxesService.listMailboxesUnpaginated(req.organizationId!);
      res.json({ data, meta: {} });
      return;
    }
    const { data, total } = await mailboxesService.listMailboxes(req.organizationId!, { page, limit });
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

mailboxesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      localPart: z.string().min(1).max(64),
      domainId: z.string(),
      password: z.string().min(8).optional(),
      quotaGb: z.number().optional(),
      quotaBytes: z.number().optional(),
    });
    const body = schema.parse(req.body);
    const quotaBytes = body.quotaBytes ?? (body.quotaGb ? body.quotaGb * 1024 * 1024 * 1024 : undefined);
    const mailbox = await mailboxesService.createMailbox(req.organizationId!, req.user!.id, {
      localPart: body.localPart,
      domainId: body.domainId,
      password: body.password,
      quotaBytes,
    }, req.requestId);
    res.status(201).json({ data: mailbox, message: 'Mailbox created successfully.', meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mailbox = await mailboxesService.getMailbox(req.params.id, req.organizationId!);
    res.json({ data: mailbox, meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.get('/:id/connection', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const details = await mailboxesService.getConnectionDetails(req.params.id, req.organizationId!);
    res.json({ data: details, meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mailboxesService.deleteMailbox(req.params.id, req.organizationId!, req.user!.id);
    res.json({ data: { success: true }, message: 'Mailbox deleted.', meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Allow quota updates via plan entitlements
    const { quotaBytes, quotaGb } = req.body as { quotaBytes?: number; quotaGb?: number };
    const qb = quotaBytes ?? (quotaGb ? quotaGb * 1024 * 1024 * 1024 : undefined);
    if (qb) {
      const { prisma } = await import('../../lib/prisma');
      const mailbox = await prisma.mailbox.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } });
      if (!mailbox) throw new Error('Mailbox not found');
      // Update via provider
      const { emailProvider } = await import('../../providers/email/mxroute/mxroute.provider');
      if (mailbox.providerMailboxId) await emailProvider.updateMailbox({ providerMailboxId: mailbox.providerMailboxId, quotaBytes: qb });
      await prisma.mailbox.update({ where: { id: req.params.id }, data: { quotaBytes: BigInt(qb), allocatedQuotaBytes: BigInt(qb) } });
    }
    const updated = await mailboxesService.getMailbox(req.params.id, req.organizationId!);
    res.json({ data: updated, meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.post('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mailbox = await mailboxesService.suspendMailbox(req.params.id, req.organizationId!, req.user!.id);
    res.json({ data: mailbox, meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.post('/:id/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mailbox = await mailboxesService.unsuspendMailbox(req.params.id, req.organizationId!, req.user!.id);
    res.json({ data: mailbox, meta: {} });
  } catch (err) { next(err); }
});

mailboxesRouter.post('/:id/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mailboxesService.resetMailboxPassword(req.params.id, req.organizationId!);
    res.json({ data: result, message: 'Password reset. Share this temporary password securely.', meta: {} });
  } catch (err) { next(err); }
});

import { Router, Request, Response, NextFunction } from 'express';
import * as domainsService from './domains.service';
import { authMiddleware, loadUserMiddleware, requireAuth } from '../../common/middleware/auth';
import { createDomainSchema } from '../../common/validation/schemas';

export const domainsRouter = Router();
domainsRouter.use(authMiddleware, loadUserMiddleware, requireAuth);

domainsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    if (hasPagination) {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
      const { data, total } = await domainsService.listDomainsPaginated(req.organizationId!, { page, limit });
      res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), requestId: req.requestId } });
      return;
    }
    const domains = await domainsService.listDomains(req.organizationId!);
    res.json({ data: domains, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

domainsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createDomainSchema.parse(req.body);
    const domain = await domainsService.createDomain(req.organizationId!, req.user!.id, parsed.name, req.requestId);
    res.status(201).json({ data: domain, message: 'Domain added. Configure DNS to activate email.', meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

domainsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = await domainsService.getDomain(req.params.id, req.organizationId!);
    res.json({ data: domain, meta: {} });
  } catch (err) { next(err); }
});

domainsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await domainsService.deleteDomain(req.params.id, req.organizationId!, req.user!.id);
    res.json({ data: { success: true }, message: 'Domain removed.', meta: {} });
  } catch (err) { next(err); }
});

domainsRouter.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = await domainsService.verifyDomain(req.params.id, req.organizationId!, req.user!.id);
    const d = domain as { status: string };
    const message = d.status === 'active' ? 'Domain verified and active.' : 'Some DNS records still need attention.';
    res.json({ data: domain, message, meta: {} });
  } catch (err) { next(err); }
});

domainsRouter.get('/:id/dns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await domainsService.getDnsRecords(req.params.id, req.organizationId!);
    const mapped = (records as Array<{ id: string; domainId: string; type: string; host: string; value: string; priority: number | null; purpose: string | null; status: string }>)
      .map((r) => {
        let status: string = r.status;
        // DMARC is optional/recommended per spec
        if (r.host === '_dmarc' && status !== 'verified') status = 'optional';
        else if (status === 'verified') status = 'verified';
        else if (status === 'error') status = 'error';
        else if (status === 'missing' || status === 'configured' || status === 'pending') status = 'pending';
        else status = 'pending';
        // Ensure client supports the value
        return {
          id: r.id,
          domainId: r.domainId,
          type: r.type,
          name: r.host,
          value: r.value,
          priority: r.priority ?? undefined,
          status,
          purpose: r.purpose ?? '',
          explanation: r.purpose ?? getExplanation(r.type, r.host),
        };
      });
    res.json({ data: mapped, meta: {} });
  } catch (err) { next(err); }
});

function getExplanation(type: string, host: string): string {
  if (type === 'MX') return 'The MX record tells the internet where to deliver email for your domain.';
  if (type === 'TXT' && host === '@') return 'SPF helps receiving servers confirm that messages from your domain are legitimate.';
  if (host.includes('_domainkey')) return 'DKIM adds a digital signature so recipients can verify your email wasn\'t altered.';
  if (host === '_dmarc') return 'DMARC tells receiving servers what to do with messages that fail SPF or DKIM. Recommended but optional to start.';
  return 'DNS record required for email delivery.';
}

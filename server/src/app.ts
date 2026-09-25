import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './common/logging/logger';
import { requestIdMiddleware } from './common/middleware/request-id';
import { errorHandler } from './common/middleware/error-handler';
import { generalLimiter, loginLimiter, registerLimiter } from './common/middleware/rate-limit';
import { authMiddleware, loadUserMiddleware } from './common/middleware/auth';

import { authRouter } from './modules/auth/auth.router';
import { plansRouter } from './modules/plans/plans.router';
import { organizationsRouter } from './modules/organizations/organizations.router';
import { domainsRouter } from './modules/domains/domains.router';
import { mailboxesRouter } from './modules/mailboxes/mailboxes.router';
import { forwardersRouter } from './modules/forwarders/forwarders.router';
import { dnsRouter } from './modules/dns/dns.router';
import { subscriptionsRouter, invoicesRouter } from './modules/subscriptions/subscriptions.router';
import { webhooksRouter } from './modules/webhooks/webhooks.router';
import { usageRouter } from './modules/usage/usage.router';
import { adminRouter } from './modules/admin/admin.router';
import { prisma } from './lib/prisma';
import { getRedis } from './lib/redis';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Admin-Token'],
  }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.use(pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (req) => ({ requestId: (req as unknown as { requestId: string }).requestId }),
  }));

  app.use('/api/webhooks/paystack', express.json({
    verify: (req: express.Request & { rawBody?: string }, _res, buf) => {
      (req as unknown as { rawBody: string }).rawBody = buf.toString('utf8');
    },
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const redis = getRedis();
      let redisStatus = 'disabled';
      if (redis) {
        try { await redis.ping(); redisStatus = 'ok'; } catch { redisStatus = 'degraded'; }
      }
      res.json({ status: 'ready', checks: { database: 'ok', redis: redisStatus } });
    } catch (err) {
      res.status(503).json({ status: 'not_ready', error: String(err) });
    }
  });

  const apiPrefix = env.API_PREFIX;
  const v1Prefix = `${apiPrefix}/v1`;

  app.use(`${apiPrefix}/auth/register`, registerLimiter);
  app.use(`${v1Prefix}/auth/register`, registerLimiter);
  app.use(`${apiPrefix}/auth/login`, loginLimiter);
  app.use(`${v1Prefix}/auth/login`, loginLimiter);
  app.use(generalLimiter);

  function mount(path: string, router: express.Router): void {
    app.use(`${apiPrefix}${path}`, router);
    app.use(`${v1Prefix}${path}`, router);
  }

  mount('/auth', authRouter);
  mount('/plans', plansRouter);
  mount('/organizations', organizationsRouter);
  mount('/domains', domainsRouter);
  mount('/mailboxes', mailboxesRouter);
  mount('/forwarders', forwardersRouter);
  mount('/dns', dnsRouter);
  mount('/subscriptions', subscriptionsRouter);
  mount('/subscription', subscriptionsRouter);
  mount('/invoices', invoicesRouter);
  mount('/billing/invoices', invoicesRouter);
  mount('/webhooks', webhooksRouter);
  mount('/usage', usageRouter);

  const dashboardRouter = express.Router();
  dashboardRouter.use(authMiddleware, loadUserMiddleware);
  dashboardRouter.get('/', async (req, res, next) => {
    try {
      const orgId = (req as unknown as { organizationId: string }).organizationId;
      if (!orgId) throw new Error('Unauthorized');
      const [domains, mailboxes, subscription] = await Promise.all([
        prisma.domain.findMany({ where: { organizationId: orgId } }),
        prisma.mailbox.findMany({ where: { organizationId: orgId } }),
        prisma.subscription.findFirst({ where: { organizationId: orgId }, include: { plan: true }, orderBy: { createdAt: 'desc' } }),
      ]);
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      const storageUsed = mailboxes.reduce((s, m) => s + Number(m.usedBytes), 0);
      const storageAvailable = mailboxes.reduce((s, m) => s + Number(m.quotaBytes), 0) || 5 * 1024 * 1024 * 1024;
      const items: Array<{ label: string; status: string; detail?: string }> = [];
      if (domains.length === 0) {
        items.push({ label: 'Domain', status: 'pending', detail: 'Not added yet' });
      } else {
        const d = domains[0];
        items.push({ label: 'Domain', status: ['verified', 'active'].includes(d.status) ? 'done' : 'pending', detail: d.name });
        const records = await prisma.dnsRecord.findMany({ where: { domainId: d.id } });
        const required = records.filter((r) => r.host !== '_dmarc');
        const verified = required.filter((r) => r.status === 'verified');
        items.push({ label: 'DNS', status: verified.length === required.length && required.length > 0 ? 'done' : verified.length > 0 ? 'warning' : 'pending', detail: `${verified.length}/${required.length} required records verified` });
      }
      if (mailboxes.length === 0) items.push({ label: 'Mailbox', status: 'pending', detail: 'None created' });
      else items.push({ label: 'Mailbox', status: 'done', detail: mailboxes[0].email });
      const subPublic = subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        planName: subscription.plan.name,
        status: subscription.status,
        priceYearlyNgn: subscription.plan.annualPrice / 100,
        billingInterval: 'yearly' as const,
        renewalDate: subscription.currentPeriodEnd?.toISOString() ?? new Date(Date.now() + 365 * 24*60*60*1000).toISOString(),
        paymentStatus: subscription.status === 'active' ? 'paid' as const : 'pending' as const,
      } : null;
      res.json({
        data: {
          account: { businessName: org?.name ?? '', subscription: subPublic, accountStatus: subPublic ? 'active' : 'setup_required' },
          email: { domainCount: domains.length, mailboxCount: mailboxes.length, storageUsedBytes: storageUsed, storageAvailableBytes: storageAvailable },
          setup: { items },
        },
        meta: {},
      });
    } catch (err) { next(err); }
  });
  mount('/dashboard', dashboardRouter);

  const onboardingRouter = express.Router();
  onboardingRouter.use(authMiddleware, loadUserMiddleware);
  onboardingRouter.get('/', async (req, res, next) => {
    try {
      const orgId = (req as unknown as { organizationId: string }).organizationId;
      const domains = await prisma.domain.findMany({ where: { organizationId: orgId } });
      const mailboxes = await prisma.mailbox.findMany({ where: { organizationId: orgId } });
      const sub = await prisma.subscription.findFirst({ where: { organizationId: orgId } });
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      let currentStep: string = 'domain';
      const completed: string[] = ['account', 'business'];
      if (!domains.length) {
        currentStep = 'domain';
      } else {
        completed.push('domain');
        if (!sub) currentStep = 'plan';
        else {
          completed.push('plan', 'payment');
          const hasVerifiedDomain = domains.some((d) => ['verified', 'active'].includes(d.status));
          if (!hasVerifiedDomain) currentStep = 'dns';
          else {
            if (!completed.includes('dns')) completed.push('dns');
            if (!mailboxes.length) currentStep = 'mailbox';
            else {
              completed.push('mailbox', 'complete');
              currentStep = 'complete';
            }
          }
        }
      }
      res.json({ data: { currentStep, completedSteps: Array.from(new Set(completed)), selectedPlanId: sub?.planId, domainName: domains[0]?.name, businessName: org?.name }, meta: {} });
    } catch (err) { next(err); }
  });
  onboardingRouter.patch('/', async (req, res) => { res.json({ data: { currentStep: (req.body as { step: string }).step }, meta: {} }); });
  mount('/onboarding', onboardingRouter);

  const accountRouter = express.Router();
  accountRouter.use(authMiddleware, loadUserMiddleware);
  accountRouter.patch('/profile', async (req, res, next) => {
    try {
      const { name, businessName } = req.body as { name: string; businessName: string };
      const userId = (req as unknown as { user: { id: string } }).user.id;
      const orgId = (req as unknown as { organizationId: string }).organizationId;
      if (name) await prisma.user.update({ where: { id: userId }, data: { name } });
      let org = null;
      if (businessName && orgId) org = await prisma.organization.update({ where: { id: orgId }, data: { name: businessName } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const token = (req.cookies as Record<string,string> | undefined)?.['aora_session'] ?? (req.headers.authorization as string | undefined) ?? '';
      res.json({ data: { user: user ? { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt.toISOString() } : null, organization: org, token }, meta: {} });
    } catch (err) { next(err); }
  });
  mount('/account', accountRouter);

  mount('/admin', adminRouter);

  const supportRouter = express.Router();
  supportRouter.use(authMiddleware, loadUserMiddleware);
  supportRouter.post('/', async (req, res, next) => {
    try {
      const { subject, message } = req.body as { subject: string; message: string };
      const ticket = await prisma.supportTicket.create({ data: { userId: (req as unknown as { user: { id: string } }).user.id, organizationId: (req as unknown as { organizationId: string }).organizationId, subject, message } });
      res.status(201).json({ data: ticket, meta: {} });
    } catch (err) { next(err); }
  });
  supportRouter.get('/', async (req, res, next) => {
    try {
      const tickets = await prisma.supportTicket.findMany({ where: { userId: (req as unknown as { user: { id: string } }).user.id }, orderBy: { createdAt: 'desc' } });
      res.json({ data: tickets, meta: {} });
    } catch (err) { next(err); }
  });
  mount('/support', supportRouter);

  app.get('/api/docs/openapi.json', async (_req, res) => {
    const { openApiSpec } = await import('./common/docs/openapi');
    res.json(openApiSpec);
  });

  app.use((req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` }, meta: {} });
      return;
    }
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });

  app.use(errorHandler);

  return app;
}

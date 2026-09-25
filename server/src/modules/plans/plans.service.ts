import { prisma } from '../../lib/prisma';
import { getRedis } from '../../lib/redis';
import { logger } from '../../common/logging/logger';

export interface PlanEntitlements {
  maxMailboxes: number;
  maxDomains: number;
  mailboxQuotaGb: number;
  aliasesAllowed: boolean;
  forwardingAllowed: boolean;
  migrationIncluded: boolean;
}

const CACHE_KEY = 'plans:all';
const CACHE_TTL = 300; // 5 min

export async function listPlans(): Promise<unknown[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached) as unknown[];
    } catch (err) {
      logger.warn({ err }, 'Redis get failed');
    }
  }
  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { annualPrice: 'asc' } });
  const mapped = plans.map(toPublicPlan);
  if (redis) {
    redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(mapped)).catch(() => {});
  }
  return mapped;
}

export async function getPlanById(id: string): Promise<unknown | null> {
  const plan = await prisma.plan.findUnique({ where: { id } });
  return plan ? toPublicPlan(plan) : null;
}

export async function getPlanBySlug(slug: string): Promise<unknown | null> {
  const plan = await prisma.plan.findUnique({ where: { slug } });
  return plan ? toPublicPlan(plan) : null;
}

export function toPublicPlan(plan: { id: string; name: string; slug: string; annualPrice: number; monthlyPrice: number | null; maxMailboxes: number; mailboxQuotaGb: number; maxDomains: number; aliasesAllowed: boolean; forwardingAllowed: boolean; migrationIncluded: boolean }): unknown {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    priceYearlyNgn: plan.annualPrice / 100,
    priceMonthlyNgn: plan.monthlyPrice ? plan.monthlyPrice / 100 : null,
    annualPrice: plan.annualPrice,
    monthlyPrice: plan.monthlyPrice,
    maxMailboxes: plan.maxMailboxes,
    mailboxQuotaGb: plan.mailboxQuotaGb,
    maxDomains: plan.maxDomains,
    mailboxLimit: plan.maxMailboxes,
    storageGbPerMailbox: plan.mailboxQuotaGb,
    aliasesAllowed: plan.aliasesAllowed,
    forwardingAllowed: plan.forwardingAllowed,
    migrationIncluded: plan.migrationIncluded,
    features: buildFeatures(plan),
  };
}

function buildFeatures(plan: { maxMailboxes: number; mailboxQuotaGb: number; aliasesAllowed: boolean; forwardingAllowed: boolean; migrationIncluded: boolean }): string[] {
  const f: string[] = [];
  f.push(`${plan.maxMailboxes} mailbox${plan.maxMailboxes === 1 ? '' : 'es'}`);
  f.push(`${plan.mailboxQuotaGb} GB per mailbox`);
  f.push('Custom domain');
  f.push('Webmail');
  f.push('IMAP/SMTP');
  if (plan.aliasesAllowed) f.push('Aliases');
  if (plan.forwardingAllowed) f.push('Forwarding');
  if (plan.migrationIncluded) f.push('Migration assistance');
  return f;
}

export function getEntitlements(plan: { maxMailboxes: number; maxDomains: number; mailboxQuotaGb: number; aliasesAllowed: boolean; forwardingAllowed: boolean; migrationIncluded: boolean }): PlanEntitlements {
  return {
    maxMailboxes: plan.maxMailboxes,
    maxDomains: plan.maxDomains,
    mailboxQuotaGb: plan.mailboxQuotaGb,
    aliasesAllowed: plan.aliasesAllowed,
    forwardingAllowed: plan.forwardingAllowed,
    migrationIncluded: plan.migrationIncluded,
  };
}

export async function getOrganizationEntitlements(organizationId: string): Promise<PlanEntitlements | null> {
  const sub = await prisma.subscription.findFirst({
    where: { organizationId, status: { in: ['active', 'trialing'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!sub) return null;
  return getEntitlements(sub.plan);
}

export async function checkEntitlement(organizationId: string, check: (e: PlanEntitlements) => boolean): Promise<boolean> {
  const ent = await getOrganizationEntitlements(organizationId);
  if (!ent) return false;
  return check(ent);
}

// Unit-testable pure functions
export function canCreateMailbox(ent: PlanEntitlements, currentCount: number): boolean {
  return currentCount < ent.maxMailboxes;
}

export function canCreateDomain(ent: PlanEntitlements, currentCount: number): boolean {
  return currentCount < ent.maxDomains;
}

export function calculateQuotaBytes(ent: PlanEntitlements): number {
  return ent.mailboxQuotaGb * 1024 * 1024 * 1024;
}

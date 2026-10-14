import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const plans = [
    {
      id: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      description: 'For solo founders and small teams getting started.',
      annualPrice: 800000, // ₦8,000 in kobo
      monthlyPrice: 120000, // ₦1,200
      maxMailboxes: 1,
      mailboxQuotaGb: 5,
      maxDomains: 1,
      aliasesAllowed: false,
      forwardingAllowed: false,
      migrationIncluded: false,
    },
    {
      id: 'plan_business',
      name: 'Business',
      slug: 'business',
      description: 'For growing businesses that need more mailboxes.',
      annualPrice: 2000000, // ₦20,000 in kobo
      monthlyPrice: 280000, // ₦2,800
      maxMailboxes: 5,
      mailboxQuotaGb: 10,
      maxDomains: 2,
      aliasesAllowed: true,
      forwardingAllowed: true,
      migrationIncluded: false,
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      slug: 'pro',
      description: 'For established businesses with larger teams.',
      annualPrice: 3000000, // ₦30,000 in kobo
      monthlyPrice: 420000, // ₦4,200
      maxMailboxes: 10,
      mailboxQuotaGb: 15,
      maxDomains: 5,
      aliasesAllowed: true,
      forwardingAllowed: true,
      migrationIncluded: true,
    },
  ];

  for (const plan of plans) {
    const { id, slug, ...rest } = plan;
    await prisma.plan.upsert({
      where: { slug },
      update: { ...rest, slug },
      create: plan,
    });
  }

  // This account exists only in databases that have deliberately been seeded.
  // It gives local developers a complete dashboard state without weakening the
  // registration flow or placing a predictable account in a production DB.
  const demoPasswordHash = await bcrypt.hash('AoraDemo!2026', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aora.test' },
    update: {
      name: 'Aora Demo',
      passwordHash: demoPasswordHash,
      emailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: 'demo_user',
      email: 'demo@aora.test',
      name: 'Aora Demo',
      passwordHash: demoPasswordHash,
      emailVerified: true,
    },
  });

  const demoOrganization = await prisma.organization.upsert({
    where: { slug: 'aora-demo' },
    update: { name: 'Aora Demo Limited', ownerId: demoUser.id },
    create: { id: 'demo_org', name: 'Aora Demo Limited', slug: 'aora-demo', ownerId: demoUser.id },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoOrganization.id, userId: demoUser.id } },
    update: { role: 'owner' },
    create: { organizationId: demoOrganization.id, userId: demoUser.id, role: 'owner' },
  });

  const businessPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: 'business' } });
  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: demoOrganization.id },
    orderBy: { createdAt: 'asc' },
  });
  const subscriptionData = {
    planId: businessPlan.id,
    status: 'active' as const,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    cancelledAt: null,
    gracePeriodEndsAt: null,
  };
  const demoSubscription = subscription
    ? await prisma.subscription.update({ where: { id: subscription.id }, data: subscriptionData })
    : await prisma.subscription.create({
        data: { id: 'demo_subscription', organizationId: demoOrganization.id, ...subscriptionData },
      });

  const demoDomain = await prisma.domain.upsert({
    where: { name: 'aora-demo.ng' },
    update: { organizationId: demoOrganization.id, status: 'active', verifiedAt: new Date() },
    create: {
      id: 'demo_domain',
      name: 'aora-demo.ng',
      organizationId: demoOrganization.id,
      status: 'active',
      verifiedAt: new Date(),
    },
  });

  for (const localPart of ['info', 'sales']) {
    const email = `${localPart}@aora-demo.ng`;
    await prisma.mailbox.upsert({
      where: { email },
      update: { organizationId: demoOrganization.id, domainId: demoDomain.id, status: 'active' },
      create: {
        organizationId: demoOrganization.id,
        domainId: demoDomain.id,
        email,
        localPart,
        quotaBytes: BigInt(10 * 1024 ** 3),
        allocatedQuotaBytes: BigInt(10 * 1024 ** 3),
        status: 'active',
      },
    });
  }

  await prisma.forwarder.upsert({
    where: { domainId_source: { domainId: demoDomain.id, source: 'hello' } },
    update: { destination: 'info@aora-demo.ng', organizationId: demoOrganization.id },
    create: {
      organizationId: demoOrganization.id,
      domainId: demoDomain.id,
      source: 'hello',
      destination: 'info@aora-demo.ng',
    },
  });

  await prisma.invoice.upsert({
    where: { number: 'DEMO-2026-001' },
    update: { organizationId: demoOrganization.id, subscriptionId: demoSubscription.id, status: 'paid', paidAt: new Date() },
    create: {
      organizationId: demoOrganization.id,
      subscriptionId: demoSubscription.id,
      number: 'DEMO-2026-001',
      amount: 280000,
      currency: 'NGN',
      status: 'paid',
      description: 'Demo Business plan subscription',
      paidAt: new Date(),
    },
  });

  console.log('Seeded plans:', plans.map((p) => p.slug).join(', '));
  console.log('Seeded demo account: demo@aora.test');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

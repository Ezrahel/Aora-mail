import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const plans = [
    {
      id: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      description: 'For solo founders and small teams getting started.',
      annualPrice: 1500000, // ₦15,000 in kobo
      monthlyPrice: 200000,
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
      annualPrice: 3000000,
      monthlyPrice: 350000,
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
      annualPrice: 5000000,
      monthlyPrice: 600000,
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

  console.log('Seeded plans:', plans.map((p) => p.slug).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

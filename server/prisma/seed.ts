import { PrismaClient } from '@prisma/client';

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

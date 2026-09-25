import type { Plan } from "@/types";

/**
 * Single source of truth for plan pricing/configuration.
 * Backend will eventually replace this with live plan data.
 */
export const PLANS: Plan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    slug: "starter",
    priceYearlyNgn: 15_000,
    mailboxLimit: 1,
    storageGbPerMailbox: 5,
    features: [
      "1 mailbox",
      "5 GB storage",
      "Custom domain",
      "Webmail",
      "IMAP/SMTP",
      "DNS setup guidance",
    ],
  },
  {
    id: "plan_business",
    name: "Business",
    slug: "business",
    priceYearlyNgn: 30_000,
    mailboxLimit: 5,
    storageGbPerMailbox: 10,
    features: [
      "Up to 5 mailboxes",
      "10 GB per mailbox",
      "Aliases",
      "Forwarding",
      "DNS assistance",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "plan_pro",
    name: "Pro",
    slug: "pro",
    priceYearlyNgn: 50_000,
    mailboxLimit: 10,
    storageGbPerMailbox: 15,
    features: [
      "Up to 10 mailboxes",
      "15 GB per mailbox",
      "Migration assistance",
      "Priority support",
      "Advanced management",
    ],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getPlanBySlug(slug: Plan["slug"]): Plan | undefined {
  return PLANS.find((plan) => plan.slug === slug);
}

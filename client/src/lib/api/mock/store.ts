import type {
  AuthSession,
  Domain,
  DnsRecord,
  Invoice,
  Mailbox,
  OnboardingState,
  Organization,
  Subscription,
  User,
} from "@/types";
import { PLANS } from "@/lib/constants/plans";
import { gbToBytes } from "@/lib/formatting";

const STORAGE_KEY = "aora_mock_store_v1";

export interface MockStore {
  session: AuthSession | null;
  users: User[];
  organizations: Organization[];
  domains: Domain[];
  dnsRecords: DnsRecord[];
  mailboxes: Mailbox[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  onboarding: OnboardingState | null;
  passwords: Record<string, string>;
}

function defaultStore(): MockStore {
  return {
    session: null,
    users: [],
    organizations: [],
    domains: [],
    dnsRecords: [],
    mailboxes: [],
    subscriptions: [],
    invoices: [],
    onboarding: null,
    passwords: {},
  };
}

export function readStore(): MockStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return { ...defaultStore(), ...(JSON.parse(raw) as MockStore) };
  } catch {
    return defaultStore();
  }
}

export function writeStore(store: MockStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function mutateStore(mutator: (store: MockStore) => void): MockStore {
  const store = readStore();
  mutator(store);
  writeStore(store);
  return store;
}

export function seedDnsRecords(domainId: string, domainName: string): DnsRecord[] {
  return [
    {
      id: `dns_${domainId}_mx`,
      domainId,
      type: "MX",
      name: "@",
      value: "mail.aora.email",
      priority: 10,
      status: "pending",
      purpose: "Mail delivery",
      explanation:
        "The MX record tells the internet where to deliver email for your domain.",
    },
    {
      id: `dns_${domainId}_spf`,
      domainId,
      type: "TXT",
      name: "@",
      value: "v=spf1 include:spf.aora.email ~all",
      status: "pending",
      purpose: "Sender authentication (SPF)",
      explanation:
        "SPF helps receiving servers confirm that messages from your domain are legitimate.",
    },
    {
      id: `dns_${domainId}_dkim`,
      domainId,
      type: "TXT",
      name: "aora._domainkey",
      value: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      status: "pending",
      purpose: "Message signing (DKIM)",
      explanation:
        "DKIM adds a digital signature so recipients can verify your email wasn't altered.",
    },
    {
      id: `dns_${domainId}_dmarc`,
      domainId,
      type: "TXT",
      name: "_dmarc",
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domainName}`,
      status: "optional",
      purpose: "Policy (DMARC)",
      explanation:
        "DMARC tells receiving servers what to do with messages that fail SPF or DKIM. Recommended but optional to start.",
    },
  ];
}

export function createDemoSubscription(planId = "plan_business"): Subscription {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
  const renewal = new Date();
  renewal.setFullYear(renewal.getFullYear() + 1);
  return {
    id: `sub_${Math.random().toString(36).slice(2, 8)}`,
    planId: plan.id,
    planName: plan.name,
    status: "active",
    priceYearlyNgn: plan.priceYearlyNgn,
    billingInterval: "yearly",
    renewalDate: renewal.toISOString(),
    paymentStatus: "paid",
  };
}

export { gbToBytes };

export type DomainStatus =
  | "pending"
  | "provisioning"
  | "dns_pending"
  | "dns_incomplete"
  | "verifying"
  | "verified"
  | "active"
  | "error"
  | "suspended";

export type MailboxStatus = "active" | "suspended" | "pending" | "error";

export type DnsRecordStatus = "verified" | "pending" | "optional" | "error" | "missing" | "configured";

export type DnsRecordType = "MX" | "TXT" | "CNAME" | "A";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing"
  | "incomplete";

export type OnboardingStep =
  | "account"
  | "business"
  | "domain"
  | "plan"
  | "payment"
  | "dns"
  | "mailbox"
  | "complete";

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export interface Plan {
  id: string;
  name: string;
  slug: "starter" | "business" | "pro";
  priceYearlyNgn: number;
  mailboxLimit: number;
  storageGbPerMailbox: number;
  features: string[];
  highlighted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
}

export interface Domain {
  id: string;
  name: string;
  status: DomainStatus;
  organizationId: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface DnsRecord {
  id: string;
  domainId: string;
  type: DnsRecordType;
  name: string;
  value: string;
  priority?: number;
  status: DnsRecordStatus;
  purpose: string;
  explanation: string;
}

export interface Mailbox {
  id: string;
  email: string;
  localPart: string;
  domainId: string;
  domainName: string;
  quotaBytes: number;
  usedBytes: number;
  status: MailboxStatus;
  createdAt: string;
}

export interface MailboxConnectionDetails {
  webmailUrl: string;
  imap: {
    host: string;
    port: number;
    encryption: string;
  };
  smtp: {
    host: string;
    port: number;
    encryption: string;
  };
  username: string;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  priceYearlyNgn: number;
  billingInterval: "yearly";
  renewalDate: string;
  paymentStatus: "paid" | "pending" | "failed";
}

export interface Invoice {
  id: string;
  number: string;
  amountNgn: number;
  status: "paid" | "pending" | "failed";
  issuedAt: string;
  paidAt?: string;
  description: string;
}

export interface AccountSummary {
  businessName: string;
  subscription: Subscription | null;
  accountStatus: "active" | "setup_required" | "suspended";
}

export interface EmailSummary {
  domainCount: number;
  mailboxCount: number;
  storageUsedBytes: number;
  storageAvailableBytes: number;
}

export interface SetupStatusItem {
  label: string;
  status: "done" | "pending" | "warning" | "error";
  detail?: string;
}

export interface SetupStatus {
  items: SetupStatusItem[];
}

export interface DashboardOverview {
  account: AccountSummary;
  email: EmailSummary;
  setup: SetupStatus;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  selectedPlanId?: string;
  domainName?: string;
  businessName?: string;
}

export interface AuthSession {
  user: User;
  organization: Organization;
  token: string;
}

export interface RegisterInput {
  name: string;
  businessName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface CreateDomainInput {
  name: string;
}

export interface CreateMailboxInput {
  localPart: string;
  domainId: string;
  password: string;
  quotaBytes: number;
}

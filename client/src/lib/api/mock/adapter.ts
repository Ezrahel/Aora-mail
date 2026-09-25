import type {
  ApiResponse,
  AuthSession,
  CreateDomainInput,
  CreateMailboxInput,
  DashboardOverview,
  DnsRecord,
  Domain,
  Invoice,
  LoginInput,
  Mailbox,
  MailboxConnectionDetails,
  OnboardingState,
  OnboardingStep,
  RegisterInput,
  Subscription,
} from "@/types";
import { PLANS } from "@/lib/constants/plans";
import { ApiClientError, createId, delay } from "@/lib/api/errors";
import {
  createDemoSubscription,
  mutateStore,
  readStore,
  seedDnsRecords,
  gbToBytes,
} from "@/lib/api/mock/store";

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { data, message };
}

function requireSession(): AuthSession {
  const session = readStore().session;
  if (!session) {
    throw new ApiClientError(401, {
      message: "Please sign in to continue.",
      code: "UNAUTHORIZED",
    });
  }
  return session;
}

const ONBOARDING_ORDER: OnboardingStep[] = [
  "account",
  "business",
  "domain",
  "plan",
  "payment",
  "dns",
  "mailbox",
  "complete",
];

export const mockApi = {
  async register(input: RegisterInput): Promise<ApiResponse<AuthSession>> {
    await delay();
    const store = readStore();
    if (store.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiClientError(409, {
        message: "An account with this email already exists.",
        code: "EMAIL_TAKEN",
        fieldErrors: { email: "This email is already registered" },
      });
    }

    const userId = createId("usr");
    const orgId = createId("org");
    const user = {
      id: userId,
      name: input.name,
      email: input.email.toLowerCase(),
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    const organization = {
      id: orgId,
      name: input.businessName,
      ownerId: userId,
    };
    const session: AuthSession = {
      user,
      organization,
      token: createId("tok"),
    };

    mutateStore((s) => {
      s.users.push(user);
      s.organizations.push(organization);
      s.passwords[user.email] = input.password;
      s.session = session;
      s.onboarding = {
        currentStep: "domain",
        completedSteps: ["account", "business"],
        businessName: input.businessName,
      };
    });

    return ok(session, "Account created. Verify your email when ready.");
  },

  async login(input: LoginInput): Promise<ApiResponse<AuthSession>> {
    await delay();
    const store = readStore();
    const email = input.email.toLowerCase();
    const user = store.users.find((u) => u.email === email);
    if (!user || store.passwords[email] !== input.password) {
      throw new ApiClientError(401, {
        message: "Incorrect email or password.",
        code: "INVALID_CREDENTIALS",
      });
    }
    const organization = store.organizations.find((o) => o.ownerId === user.id);
    if (!organization) {
      throw new ApiClientError(500, {
        message: "We couldn't load your account. Please try again.",
      });
    }
    const session: AuthSession = {
      user,
      organization,
      token: createId("tok"),
    };
    mutateStore((s) => {
      s.session = session;
    });
    return ok(session);
  },

  async logout(): Promise<ApiResponse<{ success: true }>> {
    await delay(200);
    mutateStore((s) => {
      s.session = null;
    });
    return ok({ success: true });
  },

  async getSession(): Promise<ApiResponse<AuthSession | null>> {
    await delay(150);
    return ok(readStore().session);
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ sent: true }>> {
    await delay();
    return ok(
      { sent: true },
      `If an account exists for ${email}, we sent reset instructions.`,
    );
  },

  async verifyEmail(): Promise<ApiResponse<{ verified: true }>> {
    await delay();
    const session = requireSession();
    mutateStore((s) => {
      const user = s.users.find((u) => u.id === session.user.id);
      if (user) user.emailVerified = true;
      if (s.session) s.session.user.emailVerified = true;
    });
    return ok({ verified: true }, "Email verified successfully.");
  },

  async getDashboard(): Promise<ApiResponse<DashboardOverview>> {
    await delay();
    const session = requireSession();
    const store = readStore();
    const orgId = session.organization.id;
    const domains = store.domains.filter((d) => d.organizationId === orgId);
    const mailboxes = store.mailboxes.filter((m) =>
      domains.some((d) => d.id === m.domainId),
    );
    const subscription =
      store.subscriptions.find((s) => s.status === "active") ??
      store.subscriptions[0] ??
      null;

    const storageUsed = mailboxes.reduce((sum, m) => sum + m.usedBytes, 0);
    const storageAvailable = mailboxes.reduce((sum, m) => sum + m.quotaBytes, 0);

    const items = [];
    if (domains.length === 0) {
      items.push({ label: "Domain", status: "pending" as const, detail: "Not added yet" });
    } else {
      const domain = domains[0];
      items.push({
        label: "Domain",
        status: domain.status === "active" || domain.status === "verified" ? "done" as const : "pending" as const,
        detail: domain.name,
      });
      const records = store.dnsRecords.filter((r) => r.domainId === domain.id);
      const required = records.filter((r) => r.status !== "optional");
      const verified = required.filter((r) => r.status === "verified");
      items.push({
        label: "DNS",
        status:
          verified.length === required.length
            ? ("done" as const)
            : verified.length > 0
              ? ("warning" as const)
              : ("pending" as const),
        detail: `${verified.length}/${required.length} required records verified`,
      });
      const dmarc = records.find((r) => r.name === "_dmarc");
      if (dmarc && dmarc.status !== "verified") {
        items.push({
          label: "DMARC",
          status: "warning" as const,
          detail: "Recommended",
        });
      }
    }
    if (mailboxes.length === 0) {
      items.push({ label: "Mailbox", status: "pending" as const, detail: "None created" });
    } else {
      items.push({
        label: "Mailbox",
        status: "done" as const,
        detail: mailboxes[0].email,
      });
    }

    return ok({
      account: {
        businessName: session.organization.name,
        subscription,
        accountStatus: subscription ? "active" : "setup_required",
      },
      email: {
        domainCount: domains.length,
        mailboxCount: mailboxes.length,
        storageUsedBytes: storageUsed,
        storageAvailableBytes: storageAvailable || gbToBytes(5),
      },
      setup: { items },
    });
  },

  async listDomains(): Promise<ApiResponse<Domain[]>> {
    await delay();
    const session = requireSession();
    const domains = readStore().domains.filter(
      (d) => d.organizationId === session.organization.id,
    );
    return ok(domains);
  },

  async createDomain(input: CreateDomainInput): Promise<ApiResponse<Domain>> {
    await delay(600);
    const session = requireSession();
    const name = input.name.trim().toLowerCase();
    const store = readStore();
    if (store.domains.some((d) => d.name === name)) {
      throw new ApiClientError(409, {
        message: "This domain is already connected to an account.",
        fieldErrors: { name: "Domain already exists" },
      });
    }
    const domain: Domain = {
      id: createId("dom"),
      name,
      status: "pending",
      organizationId: session.organization.id,
      createdAt: new Date().toISOString(),
    };
    const records = seedDnsRecords(domain.id, domain.name);
    mutateStore((s) => {
      s.domains.push(domain);
      s.dnsRecords.push(...records);
      if (s.onboarding && s.onboarding.currentStep === "domain") {
        s.onboarding.domainName = name;
        s.onboarding.completedSteps = Array.from(
          new Set([...s.onboarding.completedSteps, "domain"]),
        );
        s.onboarding.currentStep = "plan";
      }
    });
    return ok(domain, "Domain added. Configure DNS to activate email.");
  },

  async removeDomain(domainId: string): Promise<ApiResponse<{ success: true }>> {
    await delay();
    requireSession();
    mutateStore((s) => {
      s.domains = s.domains.filter((d) => d.id !== domainId);
      s.dnsRecords = s.dnsRecords.filter((r) => r.domainId !== domainId);
      s.mailboxes = s.mailboxes.filter((m) => m.domainId !== domainId);
    });
    return ok({ success: true }, "Domain removed.");
  },

  async getDnsRecords(domainId: string): Promise<ApiResponse<DnsRecord[]>> {
    await delay();
    requireSession();
    return ok(readStore().dnsRecords.filter((r) => r.domainId === domainId));
  },

  async verifyDomain(domainId: string): Promise<ApiResponse<Domain>> {
    await delay(800);
    requireSession();
    const store = mutateStore((s) => {
      const domain = s.domains.find((d) => d.id === domainId);
      if (!domain) return;
      const records = s.dnsRecords.filter((r) => r.domainId === domainId);
      for (const record of records) {
        if (record.status === "optional") continue;
        // Simulate progressive verification
        if (record.status === "pending") {
          record.status = "verified";
        }
      }
      const required = records.filter((r) => r.status !== "optional");
      const allVerified = required.every((r) => r.status === "verified");
      domain.status = allVerified ? "active" : "dns_incomplete";
      if (allVerified) domain.verifiedAt = new Date().toISOString();

      if (s.onboarding && allVerified && s.onboarding.currentStep === "dns") {
        s.onboarding.completedSteps = Array.from(
          new Set([...s.onboarding.completedSteps, "dns"]),
        );
        s.onboarding.currentStep = "mailbox";
      }
    });
    const domain = store.domains.find((d) => d.id === domainId);
    if (!domain) {
      throw new ApiClientError(404, { message: "Domain not found." });
    }
    return ok(
      domain,
      domain.status === "active"
        ? "Domain verified and active."
        : "Some DNS records still need attention.",
    );
  },

  async listMailboxes(): Promise<ApiResponse<Mailbox[]>> {
    await delay();
    const session = requireSession();
    const store = readStore();
    const domainIds = new Set(
      store.domains
        .filter((d) => d.organizationId === session.organization.id)
        .map((d) => d.id),
    );
    return ok(store.mailboxes.filter((m) => domainIds.has(m.domainId)));
  },

  async getMailbox(id: string): Promise<ApiResponse<Mailbox>> {
    await delay();
    requireSession();
    const mailbox = readStore().mailboxes.find((m) => m.id === id);
    if (!mailbox) {
      throw new ApiClientError(404, { message: "Mailbox not found." });
    }
    return ok(mailbox);
  },

  async getMailboxConnection(
    id: string,
  ): Promise<ApiResponse<MailboxConnectionDetails>> {
    await delay();
    requireSession();
    const mailbox = readStore().mailboxes.find((m) => m.id === id);
    if (!mailbox) {
      throw new ApiClientError(404, { message: "Mailbox not found." });
    }
    return ok({
      webmailUrl: "https://webmail.aora.ng",
      imap: { host: "imap.aora.ng", port: 993, encryption: "SSL/TLS" },
      smtp: { host: "smtp.aora.ng", port: 587, encryption: "STARTTLS" },
      username: mailbox.email,
    });
  },

  async createMailbox(input: CreateMailboxInput): Promise<ApiResponse<Mailbox>> {
    await delay(700);
    requireSession();
    const store = readStore();
    const domain = store.domains.find((d) => d.id === input.domainId);
    if (!domain) {
      throw new ApiClientError(404, { message: "Domain not found." });
    }
    if (domain.status !== "active" && domain.status !== "verified") {
      throw new ApiClientError(400, {
        message: "Finish DNS setup before creating mailboxes.",
      });
    }
    const email = `${input.localPart}@${domain.name}`;
    if (store.mailboxes.some((m) => m.email === email)) {
      throw new ApiClientError(409, {
        message: "This mailbox already exists.",
        fieldErrors: { localPart: "Address already taken" },
      });
    }
    const subscription = store.subscriptions[0];
    const plan = PLANS.find((p) => p.id === subscription?.planId) ?? PLANS[0];
    const orgMailboxes = store.mailboxes.filter((m) =>
      store.domains.some(
        (d) => d.id === m.domainId && d.organizationId === domain.organizationId,
      ),
    );
    if (orgMailboxes.length >= plan.mailboxLimit) {
      throw new ApiClientError(400, {
        message: `Your ${plan.name} plan allows up to ${plan.mailboxLimit} mailbox${plan.mailboxLimit === 1 ? "" : "es"}. Upgrade to add more.`,
      });
    }

    const mailbox: Mailbox = {
      id: createId("mbx"),
      email,
      localPart: input.localPart,
      domainId: domain.id,
      domainName: domain.name,
      quotaBytes: input.quotaBytes,
      usedBytes: Math.floor(input.quotaBytes * 0.02),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    mutateStore((s) => {
      s.mailboxes.push(mailbox);
      if (s.onboarding && s.onboarding.currentStep === "mailbox") {
        s.onboarding.completedSteps = Array.from(
          new Set([...s.onboarding.completedSteps, "mailbox", "complete"]),
        );
        s.onboarding.currentStep = "complete";
      }
    });

    return ok(mailbox, "Mailbox created successfully.");
  },

  async deleteMailbox(id: string): Promise<ApiResponse<{ success: true }>> {
    await delay();
    requireSession();
    mutateStore((s) => {
      s.mailboxes = s.mailboxes.filter((m) => m.id !== id);
    });
    return ok({ success: true }, "Mailbox deleted.");
  },

  async resetMailboxPassword(
    id: string,
  ): Promise<ApiResponse<{ temporaryPassword: string }>> {
    await delay();
    requireSession();
    const mailbox = readStore().mailboxes.find((m) => m.id === id);
    if (!mailbox) {
      throw new ApiClientError(404, { message: "Mailbox not found." });
    }
    const temporaryPassword = `Aora-${Math.random().toString(36).slice(2, 10)}!`;
    return ok(
      { temporaryPassword },
      "Password reset. Share this temporary password securely.",
    );
  },

  async getSubscription(): Promise<ApiResponse<Subscription | null>> {
    await delay();
    requireSession();
    return ok(readStore().subscriptions[0] ?? null);
  },

  async selectPlan(planId: string): Promise<ApiResponse<Subscription>> {
    await delay(500);
    requireSession();
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new ApiClientError(404, { message: "Plan not found." });
    }
    const subscription = createDemoSubscription(planId);
    mutateStore((s) => {
      s.subscriptions = [subscription];
      const issuedAt = new Date().toISOString();
      s.invoices = [
        {
          id: createId("inv"),
          number: `INV-${new Date().getFullYear()}-001`,
          amountNgn: plan.priceYearlyNgn,
          status: "paid",
          issuedAt,
          paidAt: issuedAt,
          description: `${plan.name} plan — annual`,
        },
        ...s.invoices.filter((i) => i.number !== `INV-${new Date().getFullYear()}-001`),
      ];
      if (s.onboarding) {
        s.onboarding.selectedPlanId = planId;
        s.onboarding.completedSteps = Array.from(
          new Set([...s.onboarding.completedSteps, "plan", "payment"]),
        );
        s.onboarding.currentStep = "dns";
      }
    });
    return ok(subscription, "Subscription activated.");
  },

  async listInvoices(): Promise<ApiResponse<Invoice[]>> {
    await delay();
    requireSession();
    return ok(readStore().invoices);
  },

  async getOnboarding(): Promise<ApiResponse<OnboardingState | null>> {
    await delay(200);
    requireSession();
    return ok(readStore().onboarding);
  },

  async updateOnboardingStep(
    step: OnboardingStep,
  ): Promise<ApiResponse<OnboardingState>> {
    await delay(200);
    requireSession();
    const store = mutateStore((s) => {
      if (!s.onboarding) {
        s.onboarding = {
          currentStep: step,
          completedSteps: [],
        };
      } else {
        const idx = ONBOARDING_ORDER.indexOf(step);
        const completed = ONBOARDING_ORDER.slice(0, idx);
        s.onboarding.currentStep = step;
        s.onboarding.completedSteps = Array.from(
          new Set([...s.onboarding.completedSteps, ...completed]),
        );
      }
    });
    return ok(store.onboarding!);
  },

  async updateProfile(input: {
    name: string;
    businessName: string;
  }): Promise<ApiResponse<AuthSession>> {
    await delay();
    const session = requireSession();
    const store = mutateStore((s) => {
      const user = s.users.find((u) => u.id === session.user.id);
      const org = s.organizations.find((o) => o.id === session.organization.id);
      if (user) user.name = input.name;
      if (org) org.name = input.businessName;
      if (s.session) {
        s.session.user.name = input.name;
        s.session.organization.name = input.businessName;
      }
    });
    return ok(store.session!, "Profile updated.");
  },
};

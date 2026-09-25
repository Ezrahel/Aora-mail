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
import { USE_MOCK_API, API_BASE_URL } from "@/lib/constants/site";
import { ApiClientError } from "@/lib/api/errors";
import { mockApi } from "@/lib/api/mock/adapter";

async function http<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const raw = (await response.json().catch(() => ({}))) as ApiResponse<T> & {
    message?: string;
    code?: string;
    fieldErrors?: Record<string, string>;
    error?: { message?: string; code?: string; fieldErrors?: Record<string, string> };
  };

  if (!response.ok) {
    const err = raw.error ?? { message: raw.message, code: raw.code, fieldErrors: raw.fieldErrors };
    throw new ApiClientError(response.status, {
      message: err.message ?? "Something went wrong. Please try again.",
      code: err.code,
      fieldErrors: err.fieldErrors,
    });
  }

  return raw as ApiResponse<T>;
}

/** Typed API client. Uses mock adapters until the backend is available. */
export const api = {
  register: (input: RegisterInput) =>
    USE_MOCK_API ? mockApi.register(input) : http<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput) =>
    USE_MOCK_API ? mockApi.login(input) : http<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  logout: () =>
    USE_MOCK_API ? mockApi.logout() : http<{ success: true }>("/auth/logout", {
      method: "POST",
    }),

  getSession: () =>
    USE_MOCK_API
      ? mockApi.getSession()
      : http<AuthSession | null>("/auth/session"),

  forgotPassword: (email: string) =>
    USE_MOCK_API
      ? mockApi.forgotPassword(email)
      : http<{ sent: true }>("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email }),
        }),

  verifyEmail: () =>
    USE_MOCK_API
      ? mockApi.verifyEmail()
      : http<{ verified: true }>("/auth/verify-email", { method: "POST" }),

  getDashboard: () =>
    USE_MOCK_API
      ? mockApi.getDashboard()
      : http<DashboardOverview>("/dashboard"),

  listDomains: () =>
    USE_MOCK_API ? mockApi.listDomains() : http<Domain[]>("/domains"),

  createDomain: (input: CreateDomainInput) =>
    USE_MOCK_API
      ? mockApi.createDomain(input)
      : http<Domain>("/domains", {
          method: "POST",
          body: JSON.stringify(input),
        }),

  removeDomain: (domainId: string) =>
    USE_MOCK_API
      ? mockApi.removeDomain(domainId)
      : http<{ success: true }>(`/domains/${domainId}`, { method: "DELETE" }),

  getDnsRecords: (domainId: string) =>
    USE_MOCK_API
      ? mockApi.getDnsRecords(domainId)
      : http<DnsRecord[]>(`/domains/${domainId}/dns`),

  verifyDomain: (domainId: string) =>
    USE_MOCK_API
      ? mockApi.verifyDomain(domainId)
      : http<Domain>(`/domains/${domainId}/verify`, { method: "POST" }),

  listMailboxes: () =>
    USE_MOCK_API ? mockApi.listMailboxes() : http<Mailbox[]>("/mailboxes"),

  getMailbox: (id: string) =>
    USE_MOCK_API
      ? mockApi.getMailbox(id)
      : http<Mailbox>(`/mailboxes/${id}`),

  getMailboxConnection: (id: string) =>
    USE_MOCK_API
      ? mockApi.getMailboxConnection(id)
      : http<MailboxConnectionDetails>(`/mailboxes/${id}/connection`),

  createMailbox: (input: CreateMailboxInput) =>
    USE_MOCK_API
      ? mockApi.createMailbox(input)
      : http<Mailbox>("/mailboxes", {
          method: "POST",
          body: JSON.stringify(input),
        }),

  deleteMailbox: (id: string) =>
    USE_MOCK_API
      ? mockApi.deleteMailbox(id)
      : http<{ success: true }>(`/mailboxes/${id}`, { method: "DELETE" }),

  resetMailboxPassword: (id: string) =>
    USE_MOCK_API
      ? mockApi.resetMailboxPassword(id)
      : http<{ temporaryPassword: string }>(`/mailboxes/${id}/reset-password`, {
          method: "POST",
        }),

  getSubscription: () =>
    USE_MOCK_API
      ? mockApi.getSubscription()
      : http<Subscription | null>("/subscription"),

  selectPlan: (planId: string) =>
    USE_MOCK_API
      ? mockApi.selectPlan(planId)
      : http<Subscription>("/subscription", {
          method: "POST",
          body: JSON.stringify({ planId }),
        }),

  listInvoices: () =>
    USE_MOCK_API ? mockApi.listInvoices() : http<Invoice[]>("/billing/invoices"),

  getOnboarding: () =>
    USE_MOCK_API
      ? mockApi.getOnboarding()
      : http<OnboardingState | null>("/onboarding"),

  updateOnboardingStep: (step: OnboardingStep) =>
    USE_MOCK_API
      ? mockApi.updateOnboardingStep(step)
      : http<OnboardingState>("/onboarding", {
          method: "PATCH",
          body: JSON.stringify({ step }),
        }),

  updateProfile: (input: { name: string; businessName: string }) =>
    USE_MOCK_API
      ? mockApi.updateProfile(input)
      : http<AuthSession>("/account/profile", {
          method: "PATCH",
          body: JSON.stringify(input),
        }),

  listPlans: () =>
    USE_MOCK_API
      ? Promise.resolve({ data: [] as import("@/types").Plan[] })
      : http<import("@/types").Plan[]>("/plans"),
};

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DnsSetupPanel } from "@/components/dns/dns-setup-panel";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { PLANS } from "@/lib/constants/plans";
import { formatNaira, gbToBytes, cn } from "@/lib/formatting";
import {
  createMailboxSchema,
  domainSchema,
  type CreateMailboxFormValues,
  type DomainFormValues,
} from "@/lib/validation/schemas";
import type { OnboardingStep } from "@/types";

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: "account", label: "Account" },
  { id: "business", label: "Business" },
  { id: "domain", label: "Domain" },
  { id: "plan", label: "Plan" },
  { id: "payment", label: "Payment" },
  { id: "dns", label: "DNS" },
  { id: "mailbox", label: "Mailbox" },
  { id: "complete", label: "Complete" },
];

export default function OnboardingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login?next=/onboarding");
    }
  }, [loading, session, router]);

  const onboardingQuery = useQuery({
    queryKey: ["onboarding"],
    queryFn: async () => (await api.getOnboarding()).data,
    enabled: Boolean(session),
  });

  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await api.listDomains()).data,
    enabled: Boolean(session),
  });

  const stepMutation = useMutation({
    mutationFn: (step: OnboardingStep) => api.updateOnboardingStep(step),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  if (loading || !session || onboardingQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-64" />
      </div>
    );
  }

  const state = onboardingQuery.data ?? {
    currentStep: "domain" as OnboardingStep,
    completedSteps: ["account", "business"] as OnboardingStep[],
  };

  const current = state.currentStep;

  return (
    <div className="min-h-full bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <p className="text-sm font-semibold text-ink">Setup guide</p>
          <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
            Save & continue later
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const done =
              state.completedSteps.includes(s.id) || s.id === "complete" && current === "complete";
            const active = current === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    active && "border-ink bg-ink text-white",
                    done && !active && "border-[color-mix(in_srgb,#16FF00_50%,#e5e7eb)] bg-[color-mix(in_srgb,#16FF00_12%,white)] text-ink",
                    !done && !active && "border-border bg-white text-muted",
                  )}
                  onClick={() => stepMutation.mutate(s.id)}
                >
                  {i + 1}. {s.label}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-md border border-border bg-white p-6">
          {current === "account" || current === "business" ? (
            <StepDone
              title="Account ready"
              body={`Signed in as ${session.user.email} for ${session.organization.name}.`}
              nextLabel="Continue to domain"
              onNext={() => stepMutation.mutate("domain")}
            />
          ) : null}

          {current === "domain" ? (
            <DomainStep
              onDone={() => {
                void queryClient.invalidateQueries({ queryKey: ["domains"] });
                void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
                stepMutation.mutate("plan");
              }}
            />
          ) : null}

          {current === "plan" || current === "payment" ? (
            <PlanStep
              selectedPlanId={state.selectedPlanId}
              onDone={() => {
                void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
                void queryClient.invalidateQueries({ queryKey: ["subscription"] });
                stepMutation.mutate("dns");
              }}
            />
          ) : null}

          {current === "dns" ? (
            domainsQuery.data?.[0] ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Configure DNS</h2>
                  <p className="mt-1 text-sm text-muted">
                    Your domain needs a few DNS records so your email can work correctly.
                  </p>
                </div>
                <DnsSetupPanel
                  domain={domainsQuery.data[0]}
                  onVerified={() => {
                    void queryClient.invalidateQueries({ queryKey: ["domains"] });
                    void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
                  }}
                />
                <Button variant="accent" onClick={() => stepMutation.mutate("mailbox")}>
                  Continue to mailbox
                </Button>
              </div>
            ) : (
              <StepDone
                title="Add a domain first"
                body="You need a domain before configuring DNS."
                nextLabel="Add domain"
                onNext={() => stepMutation.mutate("domain")}
              />
            )
          ) : null}

          {current === "mailbox" ? (
            <MailboxStep
              onBackToDns={() => stepMutation.mutate("dns")}
              onDone={() => {
                void queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
                void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
                stepMutation.mutate("complete");
              }}
            />
          ) : null}

          {current === "complete" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">You&apos;re set up</h2>
              <p className="text-sm text-muted">
                Your business email account is ready. Manage domains, mailboxes, and
                billing from the dashboard anytime.
              </p>
              <Link href="/dashboard" className={buttonClasses("accent", "md")}>
                Go to dashboard
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepDone({
  title,
  body,
  nextLabel,
  onNext,
}: {
  title: string;
  body: string;
  nextLabel: string;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
      <Button variant="accent" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

function DomainStep({ onDone }: { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DomainFormValues>({ resolver: zodResolver(domainSchema) });

  async function onSubmit(values: DomainFormValues) {
    try {
      const res = await api.createDomain(values);
      toast.success(res.message ?? "Domain added");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not add domain.",
      );
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h2 className="text-lg font-semibold text-ink">Connect your domain</h2>
        <p className="mt-1 text-sm text-muted">
          Use a domain you already own. You&apos;ll configure DNS in a later step.
        </p>
      </div>
      <Input
        label="Domain"
        placeholder="yourcompany.ng"
        error={errors.name?.message}
        {...register("name")}
      />
      <Button type="submit" variant="accent" loading={isSubmitting}>
        Add domain
      </Button>
    </form>
  );
}

function PlanStep({
  selectedPlanId,
  onDone,
}: {
  selectedPlanId?: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.listPlans()).data,
  });
  const plans = plansQuery.data?.length ? plansQuery.data : PLANS;

  async function choose(planId: string) {
    setPending(planId);
    try {
      const res = await api.selectPlan(planId);
      toast.success(res.message ?? "Plan activated");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not activate plan.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Choose a plan</h2>
        <p className="mt-1 text-sm text-muted">
          Payment is simulated in this demo. Production will charge via verified webhooks.
        </p>
      </div>
      <ul className="space-y-3">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
          >
            <div>
              <p className="font-medium text-ink">{plan.name}</p>
              <p className="text-sm text-muted">
                {formatNaira(plan.priceYearlyNgn)}/year · {plan.mailboxLimit} mailbox
                {plan.mailboxLimit === 1 ? "" : "es"}
              </p>
            </div>
            <Button
              variant={selectedPlanId === plan.id ? "secondary" : "accent"}
              size="sm"
              loading={pending === plan.id}
              onClick={() => void choose(plan.id)}
            >
              {selectedPlanId === plan.id ? "Selected" : "Select"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MailboxStep({
  onDone,
  onBackToDns,
}: {
  onDone: () => void;
  onBackToDns: () => void;
}) {
  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await api.listDomains()).data,
  });

  const activeDomains = (domainsQuery.data ?? []).filter(
    (d) => d.status === "active" || d.status === "verified",
  );
  const firstActiveId = activeDomains[0]?.id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMailboxFormValues>({
    resolver: zodResolver(createMailboxSchema),
    defaultValues: {
      localPart: "info",
      domainId: "",
      password: "Aora-Secure1!",
      quotaBytes: gbToBytes(5),
    },
  });

  useEffect(() => {
    if (firstActiveId) setValue("domainId", firstActiveId);
  }, [firstActiveId, setValue]);

  async function onSubmit(values: CreateMailboxFormValues) {
    try {
      const res = await api.createMailbox(values);
      toast.success(res.message ?? "Mailbox created");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not create mailbox.",
      );
    }
  }

  if (!activeDomains.length) {
    return (
      <StepDone
        title="Verify DNS first"
        body="Activate your domain before creating a mailbox."
        nextLabel="Back to DNS"
        onNext={onBackToDns}
      />
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h2 className="text-lg font-semibold text-ink">Create your first mailbox</h2>
        <p className="mt-1 text-sm text-muted">
          Start with something memorable like info@ or hello@.
        </p>
      </div>
      <Input
        label="Email prefix"
        error={errors.localPart?.message}
        {...register("localPart")}
      />
      <Select
        label="Domain"
        options={activeDomains.map((d) => ({ value: d.id, label: d.name }))}
        error={errors.domainId?.message}
        {...register("domainId")}
      />
      <Input
        label="Password"
        error={errors.password?.message}
        {...register("password")}
      />
      <input type="hidden" {...register("quotaBytes", { valueAsNumber: true })} />
      <Button type="submit" variant="accent" loading={isSubmitting}>
        Create mailbox
      </Button>
    </form>
  );
}

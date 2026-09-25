"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PricingCard } from "@/components/marketing/pricing-card";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { PLANS } from "@/lib/constants/plans";
import { formatDateLong, formatNaira } from "@/lib/formatting";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => (await api.getSubscription()).data,
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.listPlans()).data,
  });
  const plans = plansQuery.data?.length ? plansQuery.data : PLANS;

  const selectMutation = useMutation({
    mutationFn: (planId: string) => api.selectPlan(planId),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Plan updated");
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not update plan.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl rounded-md border border-border bg-white p-6">
        <p className="font-medium text-ink">Could not load subscription.</p>
        <Button className="mt-3" variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Subscription
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your plan and renewal. Prices shown in Nigerian Naira.
        </p>
      </div>

      {data ? (
        <section className="rounded-md border border-border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Current plan
              </p>
              <p className="mt-1 text-xl font-semibold text-ink">{data.planName}</p>
              <p className="mt-1 text-sm text-muted">
                {formatNaira(data.priceYearlyNgn)} / {data.billingInterval} · Renews{" "}
                {formatDateLong(data.renewalDate)}
              </p>
            </div>
            <StatusBadge
              label={data.status}
              tone={data.status === "active" ? "success" : "warning"}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-border bg-white p-5">
          <p className="font-medium text-ink">No active subscription</p>
          <p className="mt-1 text-sm text-muted">
            Choose a plan below to activate business email for your account.
          </p>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-ink">Upgrade or change plan</h2>
        <p className="mt-1 text-sm text-muted">
          Selecting a plan activates it in this demo environment. Production
          billing will use verified server-side payments.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex flex-col">
              <PricingCard plan={plan} showCta={false} />
              <Button
                className="mt-3"
                variant={data?.planId === plan.id ? "secondary" : "accent"}
                disabled={data?.planId === plan.id || selectMutation.isPending}
                loading={selectMutation.isPending}
                onClick={() => selectMutation.mutate(plan.id)}
              >
                {data?.planId === plan.id ? "Current plan" : `Select ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

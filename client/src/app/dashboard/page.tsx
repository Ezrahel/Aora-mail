"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Circle } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { formatBytes, formatDate, formatNaira } from "@/lib/formatting";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.getDashboard()).data,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-md border border-border bg-white p-6">
        <p className="font-medium text-ink">We couldn&apos;t load your dashboard.</p>
        <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
        <Button className="mt-4" variant="secondary" loading={isFetching} onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { account, email, setup } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-muted">{account.businessName}</p>
        </div>
        <Link href="/onboarding" className={buttonClasses("secondary", "sm")}>
          Continue setup
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Subscription"
          value={account.subscription?.planName ?? "None"}
          detail={
            account.subscription
              ? `${formatNaira(account.subscription.priceYearlyNgn)}/year`
              : "Choose a plan"
          }
        />
        <Stat
          label="Renewal"
          value={
            account.subscription
              ? formatDate(account.subscription.renewalDate)
              : "—"
          }
          detail={account.subscription?.paymentStatus ?? "No active plan"}
        />
        <Stat
          label="Domains"
          value={String(email.domainCount)}
          detail={`${email.mailboxCount} mailbox${email.mailboxCount === 1 ? "" : "es"}`}
        />
        <Stat
          label="Storage"
          value={formatBytes(email.storageUsedBytes)}
          detail={`of ${formatBytes(email.storageAvailableBytes)}`}
        />
      </section>

      <section className="rounded-md border border-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Account status</h2>
          <StatusBadge
            label={
              account.accountStatus === "active"
                ? "Active"
                : account.accountStatus === "suspended"
                  ? "Suspended"
                  : "Setup required"
            }
            tone={
              account.accountStatus === "active"
                ? "success"
                : account.accountStatus === "suspended"
                  ? "danger"
                  : "warning"
            }
          />
        </div>
      </section>

      <section className="rounded-md border border-border bg-white p-5">
        <h2 className="font-semibold text-ink">Setup status</h2>
        <ul className="mt-4 space-y-3">
          {setup.items.map((item) => (
            <li
              key={`${item.label}-${item.detail}`}
              className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <SetupIcon status={item.status} />
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                {item.detail ? (
                  <p className="text-sm text-muted">{item.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}

function SetupIcon({ status }: { status: "done" | "pending" | "warning" | "error" }) {
  if (status === "done") {
    return (
      <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,#16FF00_25%,white)] text-ink">
        <Check className="size-3" aria-hidden />
        <span className="sr-only">Done</span>
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="mt-0.5 text-warning">
        <AlertCircle className="size-5" aria-hidden />
        <span className="sr-only">Attention needed</span>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="mt-0.5 text-danger">
        <AlertCircle className="size-5" aria-hidden />
        <span className="sr-only">Error</span>
      </span>
    );
  }
  return (
    <span className="mt-0.5 text-muted">
      <Circle className="size-5" aria-hidden />
      <span className="sr-only">Pending</span>
    </span>
  );
}

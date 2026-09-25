"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { formatDate, formatNaira } from "@/lib/formatting";
import { Receipt } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await api.listInvoices()).data,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Billing</h1>
        <p className="mt-1 text-sm text-muted">
          Invoices and payment history for your subscription.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <div className="rounded-md border border-border bg-white p-6">
          <p className="font-medium text-ink">Could not load invoices.</p>
          <Button
            className="mt-3"
            variant="secondary"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="No invoices yet"
          description="When you activate a plan, invoices will appear here."
          actionLabel="View plans"
          onAction={() => {
            window.location.href = "/dashboard/subscription";
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {inv.number}
                  </td>
                  <td className="px-4 py-3 text-muted">{inv.description}</td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatNaira(inv.amountNgn)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(inv.issuedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={inv.status}
                      tone={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "failed"
                            ? "danger"
                            : "warning"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-border md:hidden">
            {data.map((inv) => (
              <li key={inv.id} className="space-y-1 p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-mono text-xs text-ink">{inv.number}</p>
                  <StatusBadge
                    label={inv.status}
                    tone={inv.status === "paid" ? "success" : "warning"}
                  />
                </div>
                <p className="text-sm text-muted">{inv.description}</p>
                <p className="text-sm font-medium text-ink">
                  {formatNaira(inv.amountNgn)} · {formatDate(inv.issuedAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted">
        Need a plan change?{" "}
        <Link href="/dashboard/subscription" className="text-ink underline">
          Manage subscription
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { DnsStatusBadge, DomainStatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import type { Domain, DnsRecord } from "@/types";

export function DnsSetupPanel({
  domain,
  onVerified,
}: {
  domain: Domain;
  onVerified: (domain: Domain) => void;
}) {
  const queryClient = useQueryClient();
  const [explaining, setExplaining] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dns", domain.id],
    queryFn: async () => (await api.getDnsRecords(domain.id)).data,
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.verifyDomain(domain.id),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Verification complete");
      onVerified(res.data);
      await queryClient.invalidateQueries({ queryKey: ["dns", domain.id] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "We couldn't verify DNS. Please try again.",
      );
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DomainStatusBadge status={domain.status} />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh status
          </Button>
          <Button
            size="sm"
            variant="accent"
            loading={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate()}
          >
            Verify
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Value</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((record) => (
                  <DnsRow
                    key={record.id}
                    record={record}
                    explaining={explaining}
                    onExplain={() =>
                      setExplaining((id) =>
                        id === record.id ? null : record.id,
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {(data ?? []).map((record) => (
              <li
                key={record.id}
                className="rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium text-ink">
                    {record.type} · {record.name}
                  </p>
                  <DnsStatusBadge status={record.status} />
                </div>
                <p className="mt-2 break-all font-mono text-xs text-muted">
                  {record.value}
                </p>
                <div className="mt-3 flex gap-2">
                  <CopyButton value={record.value} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExplaining((id) =>
                        id === record.id ? null : record.id,
                      )
                    }
                  >
                    <HelpCircle className="size-3.5" />
                    Explain
                  </Button>
                </div>
                {explaining === record.id ? (
                  <p className="mt-2 text-sm text-muted">{record.explanation}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DnsRow({
  record,
  explaining,
  onExplain,
}: {
  record: DnsRecord;
  explaining: string | null;
  onExplain: () => void;
}) {
  return (
    <>
      <tr className="border-b border-border align-top">
        <td className="py-3 pr-3 font-mono text-xs">{record.type}</td>
        <td className="py-3 pr-3 font-mono text-xs">{record.name}</td>
        <td className="max-w-[220px] py-3 pr-3 break-all font-mono text-xs text-muted">
          {record.priority != null ? `${record.priority} ` : ""}
          {record.value}
        </td>
        <td className="py-3 pr-3">
          <DnsStatusBadge status={record.status} />
        </td>
        <td className="py-3">
          <div className="flex flex-wrap gap-1">
            <CopyButton value={record.value} />
            <Button size="sm" variant="ghost" onClick={onExplain}>
              <HelpCircle className="size-3.5" />
              Explain
            </Button>
          </div>
        </td>
      </tr>
      {explaining === record.id ? (
        <tr className="border-b border-border bg-surface/60">
          <td colSpan={5} className="px-2 py-3 text-sm text-muted">
            <strong className="font-medium text-ink">{record.purpose}.</strong>{" "}
            {record.explanation}
          </td>
        </tr>
      ) : null}
    </>
  );
}

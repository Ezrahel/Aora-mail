"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainStatusBadge } from "@/components/ui/status-badge";
import { DnsSetupPanel } from "@/components/dns/dns-setup-panel";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatting";
import {
  domainSchema,
  type DomainFormValues,
} from "@/lib/validation/schemas";
import type { Domain } from "@/types";

export default function DomainsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Domain | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await api.listDomains()).data,
  });

  const createMutation = useMutation({
    mutationFn: (values: DomainFormValues) => api.createDomain(values),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Domain added");
      setAddOpen(false);
      setSelected(res.data);
      await queryClient.invalidateQueries({ queryKey: ["domains"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not add domain. Please try again.",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeDomain(id),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Domain removed");
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["domains"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not remove domain.",
      );
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Domains</h1>
          <p className="mt-1 text-sm text-muted">
            Connect a domain and finish DNS so email can be delivered.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => {
            reset();
            setAddOpen(true);
          }}
        >
          Add domain
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-border bg-white p-6">
          <p className="font-medium text-ink">Could not load domains.</p>
          <Button className="mt-3" variant="secondary" loading={isFetching} onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<Globe2 className="size-6" />}
          title="You haven't connected a domain yet."
          description="Add your company domain to start creating business email addresses."
          actionLabel="Add your domain"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <ul className="divide-y divide-border">
            {data.map((domain) => (
              <li
                key={domain.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{domain.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Added {formatDate(domain.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DomainStatusBadge status={domain.status} />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelected(domain)}
                  >
                    DNS instructions
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={removeMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove ${domain.name}? Mailboxes on this domain will also be removed.`,
                        )
                      ) {
                        removeMutation.mutate(domain.id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add domain"
        description="Enter the domain you want to use for business email."
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          noValidate
        >
          <Input
            label="Domain name"
            placeholder="yourcompany.ng"
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={createMutation.isPending}>
              Add domain
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Connect ${selected.name}` : "DNS setup"}
        description="Your domain needs a few DNS records so your email can work correctly."
        className="max-w-2xl"
      >
        {selected ? (
          <DnsSetupPanel
            domain={selected}
            onVerified={(domain) => {
              setSelected(domain);
              void queryClient.invalidateQueries({ queryKey: ["domains"] });
              void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

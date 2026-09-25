"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MailboxStatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { formatBytes, formatDate, gbToBytes } from "@/lib/formatting";
import {
  createMailboxSchema,
  type CreateMailboxFormValues,
} from "@/lib/validation/schemas";

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "Aora-";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function MailboxesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mailboxesQuery = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async () => (await api.listMailboxes()).data,
  });

  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await api.listDomains()).data,
  });

  const activeDomains = (domainsQuery.data ?? []).filter(
    (d) => d.status === "active" || d.status === "verified",
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateMailboxFormValues>({
    resolver: zodResolver(createMailboxSchema),
    defaultValues: {
      localPart: "",
      domainId: "",
      password: "",
      quotaBytes: gbToBytes(5),
    },
  });

  const domainId = watch("domainId");
  const selectedDomain = activeDomains.find((d) => d.id === domainId);

  const createMutation = useMutation({
    mutationFn: (values: CreateMailboxFormValues) => api.createMailbox(values),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Mailbox created");
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create mailbox.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMailbox(id),
    onSuccess: async (res) => {
      toast.success(res.message ?? "Mailbox deleted");
      await queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not delete mailbox.",
      );
    },
  });

  const isLoading = mailboxesQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Mailboxes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create and manage business email addresses.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => {
            reset({
              localPart: "",
              domainId: activeDomains[0]?.id ?? "",
              password: "",
              quotaBytes: gbToBytes(5),
            });
            setOpen(true);
          }}
        >
          Create mailbox
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : mailboxesQuery.isError ? (
        <div className="rounded-md border border-border bg-white p-6">
          <p className="font-medium text-ink">Could not load mailboxes.</p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => void mailboxesQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : !mailboxesQuery.data?.length ? (
        <EmptyState
          icon={<Mail className="size-6" />}
          title="Your domain is ready. Create your first business email."
          description={
            activeDomains.length
              ? "Pick an address like info@ or sales@ and we will provision the mailbox."
              : "Connect and verify a domain first, then create mailboxes."
          }
          actionLabel={
            activeDomains.length ? "Create mailbox" : "Add domain"
          }
          onAction={() => {
            if (activeDomains.length) setOpen(true);
            else window.location.href = "/dashboard/domains";
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Storage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mailboxesQuery.data.map((mb) => (
                  <tr key={mb.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{mb.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatBytes(mb.usedBytes)} / {formatBytes(mb.quotaBytes)}
                    </td>
                    <td className="px-4 py-3">
                      <MailboxStatusBadge status={mb.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(mb.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/mailboxes/${mb.id}`} className={buttonClasses("secondary", "sm")}>
                          View
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Delete ${mb.email}?`)) {
                              deleteMutation.mutate(mb.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border md:hidden">
            {mailboxesQuery.data.map((mb) => (
              <li key={mb.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{mb.email}</p>
                  <MailboxStatusBadge status={mb.status} />
                </div>
                <p className="text-sm text-muted">
                  {formatBytes(mb.usedBytes)} / {formatBytes(mb.quotaBytes)}
                </p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/mailboxes/${mb.id}`} className={buttonClasses("secondary", "sm")}>
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create mailbox"
        description="Provision a new business email address."
      >
        {!activeDomains.length ? (
          <p className="text-sm text-muted">
            Verify DNS on a domain before creating mailboxes.{" "}
            <Link href="/dashboard/domains" className="text-ink underline">
              Go to domains
            </Link>
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <Input
                label="Email"
                placeholder="sales"
                error={errors.localPart?.message}
                {...register("localPart")}
              />
              <span className="hidden pb-2 text-muted sm:inline">@</span>
              <Select
                label="Domain"
                error={errors.domainId?.message}
                options={[
                  { value: "", label: "Select domain" },
                  ...activeDomains.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
                {...register("domainId")}
              />
            </div>
            {selectedDomain && watch("localPart") ? (
              <p className="font-mono text-sm text-muted">
                {watch("localPart")}@{selectedDomain.name}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Password"
                  type="text"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setValue("password", generatePassword(), { shouldValidate: true })}
              >
                Generate
              </Button>
            </div>
            <Select
              label="Storage"
              options={[
                { value: String(gbToBytes(5)), label: "5 GB" },
                { value: String(gbToBytes(10)), label: "10 GB" },
                { value: String(gbToBytes(15)), label: "15 GB" },
              ]}
              {...register("quotaBytes", { valueAsNumber: true })}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" loading={createMutation.isPending}>
                Create mailbox
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}

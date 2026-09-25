"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MailboxStatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { formatBytes, formatDate } from "@/lib/formatting";

export default function MailboxDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const mailboxQuery = useQuery({
    queryKey: ["mailbox", id],
    queryFn: async () => (await api.getMailbox(id)).data,
  });

  const connectionQuery = useQuery({
    queryKey: ["mailbox-connection", id],
    queryFn: async () => (await api.getMailboxConnection(id)).data,
    enabled: Boolean(mailboxQuery.data),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetMailboxPassword(id),
    onSuccess: (res) => {
      toast.success(res.message ?? "Password reset");
      window.prompt(
        "Temporary password (copy it now — it won't be shown again):",
        res.data.temporaryPassword,
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not reset password.",
      );
    },
  });

  if (mailboxQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (mailboxQuery.isError || !mailboxQuery.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-md border border-border bg-white p-6">
        <p className="font-medium text-ink">Mailbox not found.</p>
        <Link href="/dashboard/mailboxes" className={buttonClasses("secondary", "md", "mt-3")}>
          Back to mailboxes
        </Link>
      </div>
    );
  }

  const mb = mailboxQuery.data;
  const conn = connectionQuery.data;
  const usagePct = Math.min(100, Math.round((mb.usedBytes / mb.quotaBytes) * 100));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/mailboxes"
            className="text-sm text-muted hover:text-ink"
          >
            ← Mailboxes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {mb.email}
          </h1>
          <div className="mt-2">
            <MailboxStatusBadge status={mb.status} />
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={resetMutation.isPending}
          onClick={() => resetMutation.mutate()}
        >
          Reset password
        </Button>
      </div>

      <section className="rounded-md border border-border bg-white p-5">
        <h2 className="font-semibold text-ink">Storage usage</h2>
        <p className="mt-2 text-sm text-muted">
          {formatBytes(mb.usedBytes)} of {formatBytes(mb.quotaBytes)} used · Created{" "}
          {formatDate(mb.createdAt)}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-ink"
            style={{
              width: `${usagePct}%`,
              boxShadow: "inset 0 -2px 0 0 #16FF00",
            }}
            role="progressbar"
            aria-valuenow={usagePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Storage used"
          />
        </div>
      </section>

      <section className="rounded-md border border-border bg-white p-5">
        <h2 className="font-semibold text-ink">Connection details</h2>
        <p className="mt-2 text-sm text-muted">
          Use these settings to connect your mailbox to Outlook, Apple Mail,
          Thunderbird, Android, or iPhone.
        </p>
        {connectionQuery.isLoading || !conn ? (
          <Skeleton className="mt-4 h-32" />
        ) : (
          <div className="mt-4 space-y-4">
            <ConnRow label="Webmail" value={conn.webmailUrl} />
            <ConnRow label="Username" value={conn.username} />
            <ConnRow
              label="IMAP"
              value={`${conn.imap.host}:${conn.imap.port} (${conn.imap.encryption})`}
            />
            <ConnRow
              label="SMTP"
              value={`${conn.smtp.host}:${conn.smtp.port} (${conn.smtp.encryption})`}
            />
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-white p-5">
        <h2 className="font-semibold text-ink">Security</h2>
        <p className="mt-2 text-sm text-muted">
          Never share mailbox passwords in chat or email. Use a password manager,
          and reset credentials immediately if you suspect compromise.
        </p>
      </section>
    </div>
  );
}

function ConnRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-1 break-all font-mono text-sm text-ink">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

import type { DomainStatus, MailboxStatus, DnsRecordStatus } from "@/types";
import { cn } from "@/lib/formatting";

const domainLabels: Record<DomainStatus, string> = {
  pending: "Pending",
  provisioning: "Provisioning",
  dns_pending: "DNS pending",
  dns_incomplete: "DNS incomplete",
  verifying: "Verifying",
  verified: "Verified",
  active: "Active",
  error: "Error",
  suspended: "Suspended",
};

const mailboxLabels: Record<MailboxStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  pending: "Pending",
  error: "Error",
};

const dnsLabels: Record<DnsRecordStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  optional: "Recommended",
  error: "Error",
  missing: "Missing",
  configured: "Configured",
};

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

function toneClasses(tone: Tone): string {
  switch (tone) {
    case "success":
      return "bg-[color-mix(in_srgb,#16FF00_18%,white)] text-ink border-[color-mix(in_srgb,#16FF00_45%,#e5e7eb)]";
    case "warning":
      return "bg-amber-50 text-warning border-amber-200";
    case "danger":
      return "bg-red-50 text-danger border-red-200";
    case "info":
      return "bg-sky-50 text-sky-800 border-sky-200";
    default:
      return "bg-surface text-muted border-border";
  }
}

function domainTone(status: DomainStatus): Tone {
  if (status === "active" || status === "verified") return "success";
  if (status === "error" || status === "suspended") return "danger";
  if (status === "dns_incomplete" || status === "dns_pending" || status === "verifying" || status === "provisioning") return "warning";
  return "neutral";
}

function mailboxTone(status: MailboxStatus): Tone {
  if (status === "active") return "success";
  if (status === "suspended" || status === "error") return "danger";
  return "warning";
}

function dnsTone(status: DnsRecordStatus): Tone {
  if (status === "verified") return "success";
  if (status === "error") return "danger";
  if (status === "optional") return "info";
  if (status === "missing") return "danger";
  if (status === "configured") return "warning";
  return "warning";
}

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        toneClasses(tone),
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-accent",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
          tone === "info" && "bg-sky-500",
          tone === "neutral" && "bg-muted",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  return (
    <StatusBadge label={domainLabels[status]} tone={domainTone(status)} />
  );
}

export function MailboxStatusBadge({ status }: { status: MailboxStatus }) {
  return (
    <StatusBadge label={mailboxLabels[status]} tone={mailboxTone(status)} />
  );
}

export function DnsStatusBadge({ status }: { status: DnsRecordStatus }) {
  return <StatusBadge label={dnsLabels[status]} tone={dnsTone(status)} />;
}

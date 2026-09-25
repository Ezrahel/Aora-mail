import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-surface/60 px-6 py-10">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="accent" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

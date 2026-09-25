import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/formatting";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-ink", className)}>
      <span
        className="flex size-7 items-center justify-center rounded-md bg-ink text-sm text-white"
        aria-hidden
      >
        <span className="relative">
          A
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent" />
        </span>
      </span>
      <span>{SITE.name}</span>
    </span>
  );
}

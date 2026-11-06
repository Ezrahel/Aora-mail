import { SpiralMark } from "@/components/brand/spiral-mark";
import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/formatting";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em] text-ink", className)}>
      <SpiralMark className="size-[22px] text-accent" />
      <span>{SITE.name}</span>
    </span>
  );
}

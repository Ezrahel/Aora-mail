import { cn } from "@/lib/formatting";
import { BOWL, STROKE } from "./spiral-geometry";

export function SpiralMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={cn("block", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ellipse {...BOWL} stroke="currentColor" strokeWidth="7" />
      <path d={STROKE} stroke="currentColor" strokeWidth="7" strokeLinecap="square" strokeLinejoin="round" />
    </svg>
  );
}

/** Loading indicator for app surfaces, in place of a generic ring. */
export function SpiralLoader({ className }: { className?: string }) {
  return <SpiralMark className={cn("spiral-loader text-accent", className)} title="Loading" />;
}

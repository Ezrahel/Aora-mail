import { cn } from "@/lib/formatting";

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return `${(50 + Math.cos(radians) * radius).toFixed(2)} ${(50 - Math.sin(radians) * radius).toFixed(2)}`;
}

/** The @ as one continuous spiral: the same stroke the 3D scene is built from. */
const OUTER = Array.from({ length: 49 }, (_, index) => {
  const degrees = -18 + (index / 48) * 323;
  return polar(38 + (index / 48) * 9, degrees);
});

const STROKE = `M 62 33 V 58 C 62 68 74 68 79 58 L ${OUTER.join(" L ")}`;

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
      <ellipse cx="46" cy="49" rx="16.5" ry="18" stroke="currentColor" strokeWidth="7" />
      <path d={STROKE} stroke="currentColor" strokeWidth="7" strokeLinecap="square" strokeLinejoin="round" />
    </svg>
  );
}

/** Loading indicator for app surfaces, in place of a generic ring. */
export function SpiralLoader({ className }: { className?: string }) {
  return <SpiralMark className={cn("spiral-loader text-accent", className)} title="Loading" />;
}

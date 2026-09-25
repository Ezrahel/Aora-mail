import { cn } from "@/lib/formatting";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "glass";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-[#1d1d1f] text-white hover:bg-black shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)] active:scale-[0.98]",
  secondary:
    "bg-white text-[#1d1d1f] border border-black/10 hover:bg-[#f5f5f7] hover:border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  ghost: "bg-transparent text-[#1d1d1f] hover:bg-black/[0.06] border border-transparent",
  danger: "bg-[#ff3b30] text-white hover:bg-[#e5342a] shadow-[0_4px_12px_rgba(255,59,48,0.25)]",
  accent:
    "bg-[#16FF00] text-[#0a1f0a] hover:bg-[#14e600] shadow-[0_4px_16px_rgba(22,255,0,0.35),0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.98] font-semibold",
  glass:
    "glass text-[#1d1d1f] hover:bg-white/80 border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl",
};

export const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] rounded-full",
  md: "h-10 px-5 text-[13px] rounded-full",
  lg: "h-11 px-6 text-[14px] rounded-full",
  xl: "h-[52px] px-8 text-[15px] rounded-full",
};

const variants = buttonVariants;
const sizes = buttonSizes;

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}

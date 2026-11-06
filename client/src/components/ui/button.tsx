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
  primary: "bg-ink text-[#0a0c0b] hover:bg-surface active:translate-y-px",
  secondary: "bg-surface text-ink border border-border hover:border-border-strong hover:bg-[#181c19]",
  ghost: "bg-transparent text-ink hover:bg-white/[0.06] border border-transparent",
  danger: "bg-danger text-white hover:brightness-110",
  accent: "bg-accent text-accent-ink hover:bg-[#4dff3a] active:translate-y-px font-semibold",
  glass: "glass text-ink hover:border-border-strong",
};

export const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-4 text-[13px] rounded-md",
  lg: "h-11 px-5 text-[14px] rounded-md",
  xl: "h-[52px] px-7 text-[15px] rounded-md",
};

const variants = buttonVariants;
const sizes = buttonSizes;

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
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

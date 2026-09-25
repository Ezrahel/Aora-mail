import { cn } from "@/lib/formatting";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ className, label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-medium text-[#1d1d1f]">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-2xl border border-black/10 bg-white px-3.5 text-sm text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "placeholder:text-[#86868b]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/30 focus-visible:border-[#0A84FF]/30 focus-visible:shadow-[0_0_0_4px_rgba(10,132,255,0.1)]",
          error && "border-[#ff3b30] bg-[#fff5f5] focus-visible:ring-[#ff3b30]/20 focus-visible:border-[#ff3b30]",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-[#ff3b30]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-[#86868b]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

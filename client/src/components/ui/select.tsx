import { cn } from "@/lib/formatting";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ className, label, error, options, id, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-[13px] font-medium text-[#1d1d1f]">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-11 w-full rounded-2xl border border-black/10 bg-white px-3.5 text-sm text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/30 focus-visible:border-[#0A84FF]/30",
          error && "border-[#ff3b30] bg-[#fff5f5]",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-[#ff3b30]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn, formatNaira } from "@/lib/formatting";
import type { Plan } from "@/types";

export function PricingCard({
  plan,
  ctaHref = "/register",
  showCta = true,
}: {
  plan: Plan;
  ctaHref?: string;
  showCta?: boolean;
}) {
  const featured = Boolean(plan.highlighted);

  return (
    <article className={cn("panel relative flex h-full flex-col rounded-lg p-6 transition-colors duration-300 hover:border-border-strong", featured && "crosshair border-accent/40")}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-ink">{plan.name}</h3>
        {featured ? <span className="eyebrow text-accent!">Most popular</span> : null}
      </div>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[34px] font-medium leading-none tracking-[-0.04em] text-ink">{formatNaira(plan.priceYearlyNgn)}</span>
        <span className="text-sm text-muted">/year</span>
      </p>
      <p className="mt-2 font-mono text-xs text-muted">
        {plan.mailboxLimit} mailbox{plan.mailboxLimit === 1 ? "" : "es"} · {plan.storageGbPerMailbox} GB{plan.mailboxLimit === 1 ? "" : " each"}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-ink-soft">
            <Check className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={2.5} />
            {feature}
          </li>
        ))}
      </ul>
      {showCta ? (
        <Link href={`${ctaHref}?plan=${plan.slug}`} className={cn("mt-7", buttonClasses(featured ? "accent" : "secondary", "md", "w-full"))}>
          Choose {plan.name}
        </Link>
      ) : null}
    </article>
  );
}

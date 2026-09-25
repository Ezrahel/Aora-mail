"use client";

import Link from "next/link";
import type { Plan } from "@/types";
import { buttonClasses } from "@/components/ui/button";
import { formatNaira } from "@/lib/formatting";
import { Check, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/formatting";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/effects/tilt-card";

export function PricingCard({
  plan,
  ctaHref = "/register",
  showCta = true,
}: {
  plan: Plan;
  ctaHref?: string;
  showCta?: boolean;
}) {
  const isPro = plan.slug === "pro";
  const isBusiness = plan.slug === "business";

  return (
    <TiltCard>
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative flex flex-col overflow-visible rounded-[32px] border bg-white p-7 pt-10",
          isBusiness
            ? "border-[#16FF00]/30 shadow-[0_12px_40px_rgba(22,255,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]"
            : "border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
          isPro && "bg-gradient-to-b from-[#1d1d1f] to-[#0a0a0f] border-white/10 text-white",
        )}
      >
        {/* Accent glow — keep inside rounded bounds */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
          {isBusiness ? <div className="absolute -top-20 -right-20 size-40 rounded-full bg-[#16FF00]/15 blur-3xl" /> : null}
          {isPro ? <div className="absolute -top-20 -right-20 size-40 rounded-full bg-[#BF5AF2]/20 blur-3xl" /> : null}
        </div>

        {plan.highlighted ? (
          <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16FF00] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#0a1f0a] shadow-[0_4px_12px_rgba(22,255,0,0.35)] ring-1 ring-black/5">
            Most popular
          </span>
        ) : null}

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-2xl",
              plan.slug === "starter" && "bg-[#f5f5f7] text-[#1d1d1f]",
              isBusiness && "bg-[#16FF00] text-[#0a1f0a] shadow-[0_4px_12px_rgba(22,255,0,0.3)]",
              isPro && "bg-white/10 text-white border border-white/20",
            )}
          >
            {isPro ? <Sparkles className="size-4" /> : isBusiness ? <Zap className="size-4" /> : <span className="size-2 rounded-full bg-[#16FF00]" />}
          </span>
          <h3 className={cn("text-[17px] font-semibold", isPro ? "text-white" : "text-[#1d1d1f]")}>{plan.name}</h3>
        </div>

        <p className="mt-4 flex items-baseline gap-1.5">
          <span className={cn("text-[32px] font-semibold tracking-tight", isPro ? "text-white" : "text-[#1d1d1f]")}>
            {formatNaira(plan.priceYearlyNgn)}
          </span>
          <span className={cn("text-sm", isPro ? "text-white/60" : "text-[#86868b]")}>/year</span>
        </p>
        <p className={cn("text-xs", isPro ? "text-white/50" : "text-[#86868b]")}>
          {plan.slug === "starter" ? "1 mailbox · 5GB" : plan.slug === "business" ? "5 mailboxes · 10GB each" : "10 mailboxes · 15GB each"}
        </p>

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  isPro ? "bg-white/10 border border-white/15" : "bg-[#f5f5f7] border border-black/5",
                )}
              >
                <Check className={cn("size-3", isPro ? "text-white" : "text-[#1d1d1f]")} strokeWidth={2.5} />
              </span>
              <span className={cn("text-sm leading-relaxed", isPro ? "text-white/80" : "text-[#1d1d1f]")}>{feature}</span>
            </li>
          ))}
        </ul>

        {showCta ? (
          <Link
            href={`${ctaHref}?plan=${plan.slug}`}
            className={cn(
              "mt-8 flex w-full",
              buttonClasses(isBusiness ? "accent" : isPro ? "primary" : "secondary", "md", isPro ? "bg-white text-[#1d1d1f] hover:bg-white/90 w-full" : "w-full"),
            )}
          >
            Choose {plan.name}
          </Link>
        ) : null}
      </motion.article>
    </TiltCard>
  );
}

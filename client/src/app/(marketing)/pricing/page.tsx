import type { Metadata } from "next";
import { PricingCard } from "@/components/marketing/pricing-card";
import { PLANS } from "@/lib/constants/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Business email plans for Nigerian SMEs. Starter, Business, and Pro — priced yearly in Naira.",
};

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg -z-10" />
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full glass border border-black/5 px-3 py-1 text-xs font-semibold text-[#1d1d1f]">Pricing</div>
          <h1 className="mt-4 text-title text-[#1d1d1f]">Transparent yearly plans.</h1>
          <p className="mt-3 text-[15px] text-[#6e6e73]">Priced in Naira. No surprise add-ons for the basics — mailboxes, DNS guidance, and IMAP/SMTP access are included. Upgrade when your team grows.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl glass border border-black/5 p-4 flex items-center gap-3">
          <span className="size-2 rounded-full bg-[#16FF00] shadow-[0_0_8px_rgba(22,255,0,0.5)]" />
          <p className="text-sm text-[#1d1d1f]">Plan limits and pricing are configurable and may change. Final entitlements are confirmed at checkout.</p>
        </div>
      </div>
    </div>
  );
}

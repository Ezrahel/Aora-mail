import type { Metadata } from "next";
import { Reveal } from "@/components/landing/reveal";
import { PricingCard } from "@/components/marketing/pricing-card";
import { PLANS } from "@/lib/constants/plans";
import { JsonLd, pricingGraph } from "@/lib/seo/json-ld";
import { publicPage } from "@/lib/seo/metadata";

export const metadata: Metadata = publicPage({
  title: "Business Email Pricing in Naira",
  description: "Compare Aora business email plans for Nigerian SMEs. Starter, Business and Pro, priced yearly in Naira with mailboxes and DNS guidance included.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div data-scene={4} className="mx-auto min-h-[100svh] max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <JsonLd data={pricingGraph(PLANS)} />
      <p className="eyebrow rise">Pricing</p>
      <h1 className="text-display rise mt-6 max-w-[44rem] text-ink" style={{ "--i": 1 } as React.CSSProperties}>Transparent yearly plans.</h1>
      <p className="rise mt-6 max-w-[34rem] text-[17px] leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
        Priced in Naira. Mailboxes, DNS guidance and IMAP/SMTP access are included, with no surprise add-ons. Upgrade when your team grows.
      </p>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan, index) => <Reveal key={plan.id} delay={index * 0.07}><PricingCard plan={plan} /></Reveal>)}
      </div>

      <p className="mt-6 flex items-start gap-2.5 text-sm text-muted"><span className="live-dot mt-1.5" />Plan limits and pricing are configurable and may change. Final entitlements are confirmed at checkout.</p>
    </div>
  );
}

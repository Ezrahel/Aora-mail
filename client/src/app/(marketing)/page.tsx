import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ControlRoom } from "@/components/landing/control-room";
import { Hero } from "@/components/landing/hero";
import { Journey } from "@/components/landing/journey";
import { Reveal } from "@/components/landing/reveal";
import { ZoneEditor } from "@/components/landing/zone-editor";
import { PricingCard } from "@/components/marketing/pricing-card";
import { buttonClasses } from "@/components/ui/button";
import { PLANS } from "@/lib/constants/plans";
import { SITE } from "@/lib/constants/site";
import { formatNaira } from "@/lib/formatting";
import { publicPage } from "@/lib/seo/metadata";

const startingPrice = formatNaira(Math.min(...PLANS.map((plan) => plan.priceYearlyNgn)));

export const metadata: Metadata = publicPage({
  title: `${SITE.name} | Professional Business Email for Nigerian Businesses`,
  absoluteTitle: true,
  description: `Professional email on your own domain, with guided DNS setup and simple mailbox management. Plans from ${startingPrice} a year, priced in Naira.`,
  path: "/",
  sharedCard: true,
});

export default function HomePage() {
  return <>
    <Hero />
    <Journey />
    <ZoneEditor />
    <ControlRoom />

    <section data-scene={4} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Clear plans, priced yearly</p>
            <h2 className="text-title mt-5 text-ink">Pick the room your team needs.</h2>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-ink transition hover:text-accent">Compare all plans <ArrowRight className="size-4" /></Link>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan, index) => <Reveal key={plan.id} delay={index * 0.07}><PricingCard plan={plan} /></Reveal>)}
        </div>
      </div>
    </section>

    <section data-scene={5} className="relative flex min-h-[92svh] items-end py-20 lg:items-center">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <Reveal className="max-w-[36rem]">
          <h2 className="text-display text-ink">Give people an address they can trust.</h2>
          <p className="mt-6 max-w-[28rem] text-[17px] leading-7 text-muted">Your name, your domain, and a dashboard that keeps the operational work out of your way.</p>
          <Link href="/register" className={buttonClasses("accent", "xl", "mt-8")}>Get started <ArrowRight className="size-4" /></Link>
        </Reveal>
      </div>
    </section>
  </>;
}

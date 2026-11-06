import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Journey } from "@/components/landing/journey";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description: "Choose a plan, connect your domain, create mailboxes, and start sending business email.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section data-scene={1} className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow rise">How it works</p>
        <h1 className="text-display rise mt-6 max-w-[46rem] text-ink" style={{ "--i": 1 } as React.CSSProperties}>Four steps from signup to a working inbox.</h1>
        <p className="rise mt-6 max-w-[28rem] text-[17px] leading-7 text-ink-soft" style={{ "--i": 2 } as React.CSSProperties}>Designed for busy founders, not IT teams. Scroll to walk through it.</p>
      </section>
      <Journey />
      <section data-scene={1} className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
        <h2 className="text-title max-w-[32rem] text-ink">That&apos;s the whole thing.</h2>
        <Link href="/register" className={buttonClasses("accent", "xl", "mt-8")}>Get started <ArrowRight className="size-4" /></Link>
      </section>
    </>
  );
}

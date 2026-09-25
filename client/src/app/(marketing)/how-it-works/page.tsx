import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Clock, Globe2, Mail, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How it works",
  description: "Choose a plan, connect your domain, create mailboxes, and start sending business email.",
};

const STEPS = [
  {
    title: "Choose your plan",
    body: "Select Starter, Business, or Pro based on how many mailboxes you need. You can upgrade later as your team grows. All plans include DNS guidance.",
    icon: ShieldCheck,
    color: "#16FF00",
  },
  {
    title: "Connect your domain",
    body: "Add a domain you already own. We show exactly which DNS records to create — with copy buttons, plain-language explanations, and verification.",
    icon: Globe2,
    color: "#0A84FF",
  },
  {
    title: "Create your mailboxes",
    body: "Pick an address prefix, set a password, choose storage, and provision. Connect any standard email client — Outlook, Apple Mail, mobile.",
    icon: Mail,
    color: "#BF5AF2",
  },
  {
    title: "Start sending and receiving",
    body: "Once DNS verifies, your business email is live. Monitor usage, manage addresses, and handle billing from the dashboard.",
    icon: Clock,
    color: "#FF9F0A",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg -z-10" />
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full glass border border-black/5 px-3 py-1 text-xs font-semibold text-[#1d1d1f]">How it works</div>
          <h1 className="mt-4 text-title text-[#1d1d1f]">Four steps from signup to a working inbox.</h1>
          <p className="mt-3 text-[15px] text-[#6e6e73]">Designed for busy founders — not IT teams. Each step is guided, with Apple-level clarity.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <div className="absolute -right-10 -top-10 size-24 rounded-full blur-2xl opacity-20" style={{ background: step.color }} />
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-[#f5f5f7] border border-black/5 text-[#1d1d1f]">
                <step.icon className="size-4" style={{ color: step.color }} />
              </span>
              <p className="mt-4 font-mono text-xs text-[#86868b]">0{i + 1}</p>
              <h2 className="mt-1 text-[17px] font-semibold text-[#1d1d1f]">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/register" className={buttonClasses("accent", "xl")}>
            Get started — free <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

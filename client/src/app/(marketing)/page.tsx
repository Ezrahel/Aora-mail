import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Globe2, Mail, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { PLANS } from "@/lib/constants/plans";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = { title: "Professional business email", description: SITE.description };

const capabilities = [
  ["A domain that is yours", "Send from yourcompany.ng, not a throwaway address."],
  ["Guided setup", "See exactly what to add to DNS and when it is live."],
  ["A calm control room", "Mailboxes, aliases, usage and invoices in one place."],
];

export default function HomePage() {
  return <>
    <section className="overflow-hidden bg-[#111213] text-white">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)] lg:items-end">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-white/60"><span className="size-2 rounded-full bg-[#a6ff00]" />Business email, made clear</p>
            <h1 className="mt-7 text-[clamp(3.25rem,7vw,6.5rem)] font-semibold leading-[.91] tracking-[-0.065em]">Email that<span className="block text-[#a6ff00]">looks like</span>your business.</h1>
            <p className="mt-7 max-w-md text-lg leading-8 text-white/65">Aora gives your team a professional address on your own domain, with the setup help and control you actually need.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonClasses("accent", "lg", "rounded-xl px-5")}>Create your email <ArrowRight className="size-4" /></Link>
              <Link href="/how-it-works" className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition hover:bg-white/10">See how it works <ChevronRight className="size-4 text-white/50" /></Link>
            </div>
            <p className="mt-6 text-xs text-white/45">Pay in Naira or US Dollars. Bring the domain you already own.</p>
          </div>
          <div className="relative lg:pb-2">
            <div className="absolute -right-32 -top-32 size-72 rounded-full bg-[#a6ff00]/15 blur-[100px]" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[#1b1d1e] shadow-2xl">
              <div className="flex h-12 items-center justify-between border-b border-white/10 px-5"><div className="flex gap-2"><span className="size-2 rounded-full bg-[#ff6b64]" /><span className="size-2 rounded-full bg-[#f9c74f]" /><span className="size-2 rounded-full bg-[#a6ff00]" /></div><span className="font-mono text-[11px] text-white/40">aora / workspace</span></div>
              <div className="grid gap-4 p-4 sm:grid-cols-[0.9fr_1.1fr] sm:p-6">
                <div className="rounded-2xl bg-[#242728] p-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">Your workspace</p><div className="mt-5 space-y-2">{["Overview", "Domains", "Mailboxes", "Billing"].map((item, index) => <div key={item} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${index === 0 ? "bg-white text-[#151617]" : "text-white/60"}`}><span className={`size-2 rounded-full ${index === 0 ? "bg-[#84c800]" : "bg-white/25"}`} />{item}</div>)}</div><div className="mt-8 rounded-xl border border-[#a6ff00]/20 bg-[#a6ff00]/10 p-3"><p className="text-xs font-medium text-[#c5ff66]">Everything is ready</p><p className="mt-1 text-xs leading-5 text-white/60">Your domain is verified and mail is flowing.</p></div></div>
                <div><div className="flex items-start justify-between"><div><p className="text-sm text-white/55">Good morning, Aora Demo</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Your email is in good shape.</h2></div><span className="rounded-full bg-[#a6ff00] px-2.5 py-1 text-[11px] font-bold text-[#182000]">LIVE</span></div><div className="mt-5 grid grid-cols-3 gap-2">{[["2", "mailboxes"], ["1", "domain"], ["0.7 GB", "used"]].map(([value, label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><p className="text-base font-semibold">{value}</p><p className="mt-1 text-[11px] text-white/45">{label}</p></div>)}</div><div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between text-sm"><span>Domain connection</span><span className="text-[#b7ff4b]">Verified</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full rounded-full bg-[#a6ff00]" /></div><div className="mt-4 flex items-center justify-between text-xs text-white/45"><span>yourcompany.ng</span><span>MX · SPF · DKIM</span></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="border-b border-black/[0.08] bg-[#f7f7f5]"><div className="mx-auto grid max-w-7xl gap-px bg-black/[0.08] sm:grid-cols-3">{capabilities.map(([title, body], index) => <div key={title} className="bg-[#f7f7f5] px-5 py-7 sm:px-8"><span className="text-sm font-medium text-[#6b7563]">0{index + 1}</span><h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[#1c201b]">{title}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-[#677064]">{body}</p></div>)}</div></section>
    <section className="bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-sm font-medium text-[#5f7350]">Made for the work after sign-up</p><h2 className="mt-4 max-w-md text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#1b1d1a] sm:text-5xl">A simple path from domain to first email.</h2></div><div className="grid gap-3 sm:grid-cols-2">{[[Globe2, "Connect your domain", "Bring your .ng, .com or .com.ng domain. We show the records you need."], [Mail, "Create the inboxes", "Add a mailbox for your team, a department, or the next person you hire."], [ShieldCheck, "Know what is protected", "See the status of the records that help your email arrive safely."], [SlidersHorizontal, "Stay in control", "Forward mail, manage storage and handle billing without a support ticket."]].map(([Icon, title, body]) => { const FeatureIcon = Icon as typeof Globe2; return <div key={title as string} className="rounded-2xl border border-[#dfe2dc] p-6 transition hover:border-[#b7c8a9] hover:bg-[#fbfcf9]"><FeatureIcon className="size-5 text-[#54743e]" /><h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-[#20231f]">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#697066]">{body as string}</p></div>; })}</div></div></div></section>
    <section className="bg-[#eaf4df] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#587443]">Clear plans. No surprise layers.</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#1a2417] sm:text-5xl">Pick the room your team needs.</h2></div><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b5220] hover:underline">Compare all plans <ArrowRight className="size-4" /></Link></div><div className="mt-10 grid gap-4 md:grid-cols-3">{PLANS.map((plan) => <div key={plan.id} className="rounded-2xl border border-[#cbdcc0] bg-white p-6"><p className="text-sm font-semibold text-[#263523]">{plan.name}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#192017]">₦{(plan.priceYearlyNgn / 12).toLocaleString()}<span className="text-base font-medium text-[#74806d]"> / mo</span></p><p className="mt-2 text-sm text-[#697066]">Billed yearly · {plan.mailboxLimit} mailbox{plan.mailboxLimit === 1 ? "" : "es"}</p><Link href={`/register?plan=${plan.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2c5621]">Choose {plan.name} <ArrowRight className="size-4" /></Link></div>)}</div></div></section>
    <section className="bg-[#111213] py-20 text-white sm:py-24"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-end sm:px-8"><div className="max-w-2xl"><Sparkles className="size-5 text-[#a6ff00]" /><h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">Give people an address they can trust.</h2><p className="mt-4 text-lg text-white/60">Your name, your domain, and a dashboard that keeps the operational work out of your way.</p></div><Link href="/register" className={buttonClasses("accent", "lg", "shrink-0 rounded-xl px-5")}>Get started <ArrowRight className="size-4" /></Link></div></section>
  </>;
}

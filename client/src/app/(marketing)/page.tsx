import type { Metadata } from "next";
import Link from "next/link";
import {
  AtSign,
  Forward,
  Gauge,
  Globe2,
  Mail,
  Shield,
  Sparkles,
  Wrench,
  ArrowRight,
  Check,
  Play,
  Building2,
  Users,
  CreditCard,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { PricingCard } from "@/components/marketing/pricing-card";
import { PLANS } from "@/lib/constants/plans";
import { SITE } from "@/lib/constants/site";
import { MeshGradient } from "@/components/effects/mesh-gradient";

export const metadata: Metadata = {
  title: "Professional business email",
  description: SITE.description,
};

const TRUST = [
  { label: "Custom business email", dot: "bg-[#16FF00]" },
  { label: "Domain setup assistance", dot: "bg-[#0A84FF]" },
  { label: "Secure mailboxes", dot: "bg-[#BF5AF2]" },
  { label: "Simple management", dot: "bg-[#FF9F0A]" },
  { label: "Nigerian-focused support", dot: "bg-[#64D2FF]" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO — Apple display */}
      <section className="relative overflow-hidden border-b border-black/5">
        <MeshGradient />
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full glass border border-black/5 px-3 py-1 text-xs font-medium text-[#1d1d1f] shadow-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-[#16FF00] px-2 py-0.5 text-[11px] font-semibold text-[#0a1f0a]">NEW</span>
                Trusted by 2,400+ Nigerian businesses
                <ArrowRight className="size-3 text-[#86868b]" />
              </div>

              <h1 className="mt-6 text-display text-[#1d1d1f]">
                Professional
                <span className="block bg-gradient-to-r from-[#1d1d1f] via-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
                  email for
                </span>
                <span className="block bg-gradient-to-r from-[#16FF00] via-[#14a800] to-[#0A84FF] bg-clip-text text-transparent">
                  businesses
                </span>
                <span className="block text-[#1d1d1f]">that mean business.</span>
              </h1>

              <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[#6e6e73]">
                Get reliable email at your own domain without paying for an entire office suite.
                Built for CEOs, CFOs and teams who care about how their brand feels.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={buttonClasses("accent", "xl", "group")}>
                  Get started free
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/pricing" className={buttonClasses("glass", "xl")}>
                  <Play className="size-4 fill-black/10" />
                  View plans
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-4 border-t border-black/5 pt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="size-8 rounded-full border-2 border-white bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] shadow-sm"
                      style={{ background: `hsl(${140 + i * 20} 15% 85%)` }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">4.9/5 from founders</p>
                  <p className="text-xs text-[#86868b]">“Feels like Apple made email for business.”</p>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-6">
              <ProductMockup />
              {/* Floating badge — Apple */}
              <div className="absolute -left-2 top-6 hidden glass-strong rounded-2xl px-3 py-2 shadow-float sm:flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#16FF00] text-[#0a1f0a]">
                  <Check className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#1d1d1f]">MX verified</p>
                  <p className="text-xs text-[#86868b]">2.3s ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST — Apple marquee */}
      <section className="border-y border-black/5 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#86868b]">The setup is on us</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {TRUST.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-medium text-[#1d1d1f] shadow-sm"
                >
                  <span className={`size-1.5 rounded-full ${item.dot}`} aria-hidden />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — Bento */}
      <section id="product" className="bg-[#f5f5f7] py-16 sm:py-24">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex rounded-full bg-[#16FF00]/10 border border-[#16FF00]/20 px-3 py-1 text-xs font-semibold text-[#0a6600]">How it works</div>
            <h2 className="mt-4 text-title text-[#1d1d1f]">Four steps. Done before lunch.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">Complicated infrastructure, made simple enough for any business owner. No IT degree required.</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", title: "Choose your plan", body: "Pick mailbox capacity that fits your team today.", color: "#16FF00", bg: "bg-[#16FF00]/10", icon: CreditCard },
              { n: "02", title: "Connect your domain", body: "Use a domain you own — or buy one and point it here.", color: "#0A84FF", bg: "bg-[#0A84FF]/10", icon: Globe2 },
              { n: "03", title: "Create mailboxes", body: "Spin up info@, sales@ and more in minutes.", color: "#BF5AF2", bg: "bg-[#BF5AF2]/10", icon: Users },
              { n: "04", title: "Start sending", body: "Connect Outlook, Apple Mail, or webmail.", color: "#FF9F0A", bg: "bg-[#FF9F0A]/10", icon: Mail },
            ].map((step) => (
              <div key={step.n} className="group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1">
                <div className="absolute right-0 top-0 size-28 -translate-y-8 translate-x-8 rounded-full blur-2xl opacity-20" style={{ background: step.color }} />
                <div className={`inline-flex size-9 items-center justify-center rounded-2xl ${step.bg}`}>
                  <step.icon className="size-4" style={{ color: step.color }} />
                </div>
                <p className="mt-6 font-mono text-xs font-medium text-[#86868b]">{step.n}</p>
                <h3 className="mt-1 text-[17px] font-semibold text-[#1d1d1f]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — Apple bento grid with color */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-title text-[#1d1d1f]">Everything you need<br />to run business email</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#6e6e73]">Domains, mailboxes, DNS help, and billing — without the IT degree. Designed for institutions that value clarity.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {/* Large */}
            <div className="lg:col-span-7 rounded-[32px] border border-black/5 bg-gradient-to-br from-[#E8FFE6] via-white to-[#E5F2FF] p-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-[#16FF00]/15 blur-3xl" />
              <Globe2 className="size-8 text-[#0a6600]" />
              <h3 className="mt-4 text-xl font-semibold text-[#1d1d1f]">Custom domain email</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6e6e73]">Email that matches your business name. From first impression to invoice — consistency builds trust with clients and partners.</p>
              <div className="mt-6 inline-flex rounded-full bg-[#1d1d1f] px-3 py-1 text-xs font-medium text-white">yourname@company.ng → verified</div>
            </div>
            {/* Stack */}
            <div className="lg:col-span-5 grid gap-4">
              <div className="rounded-[32px] border border-black/5 bg-[#f5f5f7] p-6">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-white border border-black/5">
                  <Mail className="size-4 text-[#1d1d1f]" />
                </div>
                <h3 className="mt-3 font-semibold text-[#1d1d1f]">Multiple mailboxes</h3>
                <p className="mt-1 text-sm text-[#6e6e73]">Create addresses for each role or teammate.</p>
              </div>
              <div className="rounded-[32px] border border-black/5 bg-[#1d1d1f] p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#BF5AF2]/20 to-transparent" />
                <Shield className="size-6 text-[#16FF00] relative" />
                <h3 className="mt-3 font-semibold relative">Spam protection</h3>
                <p className="mt-1 text-sm text-white/60 relative">Keep junk out of inboxes that matter. Enterprise-grade filtering.</p>
              </div>
            </div>

            {[
              { icon: AtSign, title: "Aliases", body: "Route alternate addresses without extra mailboxes.", color: "#0A84FF", bg: "bg-[#e5f2ff]" },
              { icon: Forward, title: "Forwarding", body: "Send copies where your team already works.", color: "#FF9F0A", bg: "bg-[#fff4e5]" },
              { icon: Gauge, title: "Usage monitoring", body: "See storage and activity at a glance.", color: "#BF5AF2", bg: "bg-[#f5e8ff]" },
              { icon: Wrench, title: "DNS assistance", body: "Clear records and guided verification.", color: "#16FF00", bg: "bg-[#e8ffe6]" },
            ].map(({ icon: Icon, title, body, color, bg }) => (
              <div key={title} className="rounded-[28px] border border-black/5 bg-white p-6 lg:col-span-3">
                <div className={`flex size-9 items-center justify-center rounded-2xl ${bg}`}>
                  <Icon className="size-4" style={{ color }} />
                </div>
                <h3 className="mt-3 font-semibold text-[#1d1d1f]">{title}</h3>
                <p className="mt-1 text-sm text-[#6e6e73]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING — Apple store cards */}
      <section className="border-y border-black/5 bg-[#f5f5f7] py-16 sm:py-20">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-title text-[#1d1d1f]">Simple yearly plans</h2>
              <p className="mt-2 text-sm text-[#6e6e73]">Priced in Naira. Upgrade when your team grows. No hidden per-seat tax.</p>
            </div>
            <Link href="/pricing" className="hidden sm:inline-flex items-center gap-1 rounded-full glass px-4 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-white">
              Compare plans <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY US — Dark with color */}
      <section className="relative overflow-hidden bg-[#1d1d1f] py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#16FF00]/10 via-transparent to-[#0A84FF]/10" />
        <div className="absolute -top-24 right-0 size-[520px] rounded-full bg-[#16FF00]/15 blur-[80px]" />
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6 relative">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="inline-flex rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">Why Aora</div>
              <h2 className="mt-4 text-title text-white">Your business email should not require an IT degree.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/60">We handle the complicated setup — DNS records, mailbox provisioning, and connection settings — so you can focus on running your business. Trusted by agencies, NGOs and institutions.</p>
            </div>
            <ul className="space-y-3">
              {[
                { t: "Guided domain connection", d: "Copy-ready DNS records with one-click verification", c: "#16FF00" },
                { t: "Clear status for every step", d: "MX, SPF, DKIM, DMARC — green means go", c: "#0A84FF" },
                { t: "Customer-friendly IMAP/SMTP", d: "Works with Outlook, Gmail, Apple Mail instantly", c: "#BF5AF2" },
                { t: "Nigerian business support", d: "We understand .ng, .com.ng and local registrars", c: "#FF9F0A" },
              ].map((item) => (
                <li key={item.t} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: item.c, boxShadow: `0 0 10px ${item.c}` }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.t}</p>
                    <p className="text-sm text-white/55">{item.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ — Apple accordion */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-title text-[#1d1d1f]">FAQ</h2>
            <p className="mt-2 text-center text-sm text-[#6e6e73]">Answers for founders, marketers and ops teams.</p>
            <div className="mt-8 divide-y divide-black/5 overflow-hidden rounded-[28px] border border-black/5 bg-[#f5f5f7]">
              {[
                { q: "What is business email?", a: "Email on your own domain — like you@yourcompany.ng — instead of a free personal address. It signals credibility." },
                { q: "Can I use my existing domain?", a: "Yes. Connect a domain you already own and we will walk you through DNS setup with copy buttons and verification." },
                { q: "Can I use Gmail or Outlook with my mailbox?", a: "Yes. Use standard IMAP/SMTP settings with Outlook, Apple Mail, Thunderbird, or mobile apps. We give you the exact settings." },
              ].map((item) => (
                <details key={item.q} className="group bg-white open:bg-[#fbfbfd] px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:content-none">
                    <span className="font-medium text-[#1d1d1f]">{item.q}</span>
                    <span className="flex size-7 items-center justify-center rounded-full border border-black/10 bg-white text-[#86868b] transition group-open:rotate-45 group-open:bg-[#1d1d1f] group-open:text-white">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6e6e73]">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/faq" className="inline-flex items-center gap-1 text-sm font-medium text-[#1d1d1f] hover:underline underline-offset-4">
                View all questions <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — Glass over mesh */}
      <section className="relative overflow-hidden bg-[#f5f5f7] py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#16FF00]/15 via-white to-[#0A84FF]/10" />
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6 relative">
          <div className="relative overflow-hidden rounded-[40px] bg-[#1d1d1f] px-6 py-10 sm:px-10 sm:py-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#16FF00]/15 via-transparent to-[#0A84FF]/15" />
            <div className="absolute -right-20 -top-20 size-[360px] rounded-full bg-[#16FF00]/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="max-w-xl text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">Give your business an email address worth trusting.</h2>
                <p className="mt-3 max-w-lg text-[15px] text-white/60">Create your account, connect a domain, and send from your company name in minutes.</p>
              </div>
              <Link href="/register" className="shrink-0">
                <span className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#16FF00] px-8 text-[15px] font-semibold text-[#0a1f0a] shadow-[0_8px_24px_rgba(22,255,0,0.35)] transition hover:bg-[#14e600] hover:scale-[1.02] active:scale-[0.98]">
                  Create your business email <Building2 className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

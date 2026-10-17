import Link from "next/link";
import { ArrowUpRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/marketing/logo";

const proofPoints = [
  "Use the domain your customers already know",
  "Keep every inbox, alias, and record in one place",
  "Get clear DNS guidance when you need it",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-ink lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border bg-[#101914] px-12 py-8 lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="absolute inset-0 auth-showcase-grid opacity-50" aria-hidden />
        <div className="auth-orb auth-orb-primary absolute -left-24 top-20 size-80 rounded-full bg-[#16FF00]/15 blur-[110px]" aria-hidden />
        <div className="auth-orb auth-orb-secondary absolute bottom-0 right-0 size-96 rounded-full bg-[#0A84FF]/10 blur-[120px]" aria-hidden />
        <div className="auth-spark auth-spark-one absolute left-[16%] top-[24%]" aria-hidden />
        <div className="auth-spark auth-spark-two absolute right-[18%] top-[62%]" aria-hidden />
        <Link href="/" className="relative z-10 inline-flex w-fit rounded-xl transition hover:opacity-80"><Logo /></Link>
        <div className="auth-showcase-content relative z-10 my-auto w-full max-w-[34rem] py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#b8c7b8]"><span className="size-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(22,255,0,0.8)]" />Business email, made clear</p>
          <h2 className="mt-6 max-w-lg text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-white xl:text-6xl">Make every message feel like your business.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[#a8b6a9]">Aora gives your team a professional home for email, without turning setup into another project.</p>
          <ul className="mt-8 space-y-3">
            {proofPoints.map((point) => <li key={point} className="flex items-center gap-3 text-sm text-[#d9e2d6]"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><Check className="size-3" strokeWidth={3} /></span>{point}</li>)}
          </ul>
          <div className="auth-showcase-card auth-signal mt-10 max-w-md p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#d9e2d6]"><Mail className="size-3.5 text-accent" /> Mail signal</div>
              <span className="font-mono text-[10px] tracking-[0.16em] text-accent">LIVE / 03</span>
            </div>
            <div className="auth-signal-line mt-5" />
            <div className="mt-5 grid grid-cols-[1fr_92px] gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Domain route</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.035em] text-white">yourcompany.ng</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-[#c7d2c7]"><span className="auth-signal-node" /> DNS verified <span className="auth-signal-path" /></div>
              </div>
              <div className="border-l border-white/10 pl-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Inboxes</p>
                <p className="mt-1 text-4xl font-semibold leading-none tracking-[-0.06em] text-white">03</p>
                <p className="mt-3 text-[11px] leading-4 text-[#a8b6a9]">ready to send</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1.5" aria-hidden>{Array.from({ length: 12 }).map((_, index) => <span key={index} className="auth-signal-bar" style={{ height: `${10 + ((index * 11) % 22)}px`, opacity: 0.35 + index / 20 }} />)}</div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs text-muted"><span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5 text-accent" /> Secure account setup</span><span className="inline-flex items-center gap-1">aora.ng <ArrowUpRight className="size-3" /></span></div>
      </section>
      <section className="relative flex min-h-screen flex-col bg-[#0b110d] px-5 py-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(22,255,0,0.09),transparent_28rem)]" aria-hidden />
        <header className="relative z-10 flex items-center justify-between lg:justify-end"><Link href="/" className="lg:hidden"><Logo /></Link><Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"><Sparkles className="size-3.5 text-accent" /> Back to Aora</Link></header>
        <main className="relative z-10 mx-auto flex w-full max-w-[430px] flex-1 items-center py-10 sm:py-14"><div className="w-full"><div className="mb-7 h-px w-10 bg-accent" />{children}</div></main>
        <p className="relative z-10 text-center text-xs text-muted lg:text-left">Protected by Aora&apos;s secure account infrastructure.</p>
      </section>
    </div>
  );
}

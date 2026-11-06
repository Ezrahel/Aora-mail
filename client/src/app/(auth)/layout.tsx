import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { AuthScene } from "@/components/scene/auth-scene";

const proofPoints = [
  "Use the domain your customers already know",
  "Keep every inbox, alias, and record in one place",
  "Get clear DNS guidance when you need it",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-ink lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border px-12 py-8 lg:flex lg:flex-col xl:px-16">
        <AuthScene />
        <Link href="/" aria-label="Aora home" className="relative z-10 w-fit"><Logo /></Link>
        <div className="relative z-10 mt-auto max-w-[30rem]">
          <p className="eyebrow flex items-center gap-2.5"><span className="live-dot" />Business email, made clear</p>
          <h2 className="text-title mt-5 text-ink">Make every message feel like your business.</h2>
          <ul className="mt-7 space-y-2.5">
            {proofPoints.map((point) => <li key={point} className="flex items-center gap-2.5 text-sm text-ink-soft"><Check className="size-3.5 shrink-0 text-accent" strokeWidth={2.5} />{point}</li>)}
          </ul>
        </div>
      </section>
      <section className="relative flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <Link href="/" aria-label="Aora home" className="lg:hidden"><Logo /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"><ArrowLeft className="size-3.5" /> Back to Aora</Link>
        </header>
        <main className="mx-auto flex w-full max-w-[430px] flex-1 items-center py-10 sm:py-14"><div className="w-full">{children}</div></main>
        <p className="font-mono text-[11px] text-muted-2">Protected by Aora&apos;s secure account infrastructure.</p>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { NAV_LINKS, SITE } from "@/lib/constants/site";

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-10 py-14 md:grid-cols-[1.6fr_0.7fr_0.7fr]">
          <div>
            <Link href="/" aria-label="Aora home" className="inline-flex"><Logo /></Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">Professional business email for ambitious teams, with clear setup, reliable mailboxes, and no unnecessary complexity.</p>
          </div>
          <div>
            <p className="eyebrow">Product</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {NAV_LINKS.map((link) => <li key={link.href}><Link href={link.href} className="text-muted transition hover:text-ink">{link.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Support</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li><a href={`mailto:${SITE.supportEmail}`} className="text-muted transition hover:text-ink">{SITE.supportEmail}</a></li>
              <li><Link href="/login" className="text-muted transition hover:text-ink">Customer login</Link></li>
              <li><Link href="/register" className="text-accent">Get started</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border py-5 font-mono text-[11px] text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p suppressHydrationWarning>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
          <p className="flex items-center gap-2"><span className="live-dot size-1.5!" /> {SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

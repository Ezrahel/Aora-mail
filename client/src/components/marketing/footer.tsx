import Link from "next/link";
import { SITE, NAV_LINKS } from "@/lib/constants/site";
import { Logo } from "@/components/marketing/logo";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-black/5 bg-[#f5f5f7]">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f5f5f7]" />
      <div className="absolute -top-24 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-[#16FF00]/6 blur-3xl" />
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 relative">
        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="inline-flex">
              <Logo />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#6e6e73]">
              Professional business email for Nigerian SMEs — clear setup, reliable mailboxes, no unnecessary complexity. Designed for leaders who value clarity.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { c: "#16FF00" },
                { c: "#0A84FF" },
                { c: "#BF5AF2" },
                { c: "#FF9F0A" },
              ].map((d, i) => (
                <span key={i} className="size-2 rounded-full" style={{ background: d.c }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1d1d1f]">Product</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/register" className="text-sm font-medium text-[#0A84FF] hover:underline">
                  Get started →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1d1d1f]">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href={`mailto:${SITE.supportEmail}`} className="text-[#6e6e73] hover:text-[#1d1d1f]">
                  {SITE.supportEmail}
                </a>
              </li>
              <li>
                <Link href="/login" className="text-[#0A84FF] hover:underline">
                  Customer login
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-flex rounded-full bg-[#1d1d1f] px-3 py-1 text-xs font-medium text-white">support@aora.ng · Lagos, NG</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-black/5 py-4">
          <div className="flex flex-col gap-2 text-xs text-[#86868b] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#16FF00] shadow-[0_0_8px_rgba(22,255,0,0.5)]" />
              Built for businesses that mean business.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

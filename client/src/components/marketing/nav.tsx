"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/marketing/logo";
import { buttonClasses } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants/site";
import { cn } from "@/lib/formatting";

export function MarketingNav() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const open = openOn === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300", scrolled || open ? "border-border bg-background/80 backdrop-blur-md" : "border-transparent")}>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Aora home"><Logo /></Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={cn("text-[13px] transition hover:text-ink", pathname === link.href ? "text-ink" : "text-muted")}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/login" className="text-[13px] text-muted transition hover:text-ink">Sign in</Link>
          <Link href="/register" className={buttonClasses("accent", "sm")}>Get started</Link>
        </div>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-md border border-border text-ink md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-border px-5 pb-5 pt-2 md:hidden" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpenOn(null)} className="block border-b border-border py-3 text-sm text-ink">
              {link.label}
            </Link>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setOpenOn(null)} className={buttonClasses("secondary", "md")}>Sign in</Link>
            <Link href="/register" onClick={() => setOpenOn(null)} className={buttonClasses("accent", "md")}>Get started</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

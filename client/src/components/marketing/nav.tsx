"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/marketing/logo";
import { NAV_LINKS } from "@/lib/constants/site";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 pt-3 sm:pt-4">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
        {/* Apple floating pill — liquid glass */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`mx-auto flex h-[52px] items-center justify-between rounded-full border px-2 sm:px-3 transition-all duration-300 ${
            scrolled
              ? "glass-strong border-white/60 shadow-float max-w-[900px]"
              : "glass border-white/40 max-w-[980px]"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 pl-2">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#1d1d1f]/70 transition hover:bg-black/[0.06] hover:text-[#1d1d1f]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-[13px] font-medium text-[#1d1d1f] transition hover:bg-black/[0.06]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex h-9 items-center justify-center rounded-full bg-[#1d1d1f] px-5 text-[13px] font-medium text-white transition hover:bg-black"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent opacity-60" />
              <span className="relative">Get started</span>
              <span className="relative ml-1.5 size-1.5 rounded-full bg-[#16FF00] shadow-[0_0_8px_rgba(22,255,0,0.7)]" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#1d1d1f] text-white md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </motion.div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mt-3 glass-strong rounded-[24px] p-2 md:hidden"
            >
              <nav className="flex flex-col gap-1 p-2" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl px-3 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-black/[0.06]"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-1 flex flex-col gap-2 border-t border-black/10 pt-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white border border-black/10 py-2.5 text-center text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-[#1d1d1f] py-2.5 text-center text-sm font-medium text-white"
                  >
                    Get started
                  </Link>
                </div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

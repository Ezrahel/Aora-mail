"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  X,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/formatting";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "#0A84FF" },
  { href: "/dashboard/domains", label: "Domains", icon: Globe2, color: "#16FF00" },
  { href: "/dashboard/mailboxes", label: "Mailboxes", icon: Mail, color: "#BF5AF2" },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard, color: "#FF9F0A" },
  { href: "/dashboard/billing", label: "Billing", icon: Receipt, color: "#64D2FF" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "#6e6e73" },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle, color: "#FF375F" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, session, router, pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1d1d1f] border-r-transparent" aria-label="Loading" />
          <p className="text-xs font-medium tracking-widest text-[#86868b]">AORA</p>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV.map(({ href, label, icon: Icon, color }) => {
        const active =
          href === "/dashboard"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-[#1d1d1f] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                : "text-[#6e6e73] hover:bg-white hover:text-[#1d1d1f] hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition",
                active ? "bg-white/15 text-white" : "bg-white border border-black/5 text-[#86868b] group-hover:border-black/10",
              )}
              style={active ? { background: color, color: "#fff" } : undefined}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* Sidebar — Apple liquid glass */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col lg:flex">
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="glass-strong rounded-[28px] p-4 flex-1 flex flex-col shadow-float border-white/60">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center">
                <Logo />
              </Link>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-[#16FF00]/10 border border-[#16FF00]/20 px-2 py-1 text-[11px] font-semibold text-[#0a6600]">
                <Sparkles className="size-3" />
                Business
              </span>
            </div>
            <div className="mt-6 flex-1">{nav}</div>
            <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-3 border border-black/5">
              <p className="text-xs font-medium text-[#86868b] truncate">{session.organization.name}</p>
              <p className="truncate text-sm font-medium text-[#1d1d1f]">{session.user.email}</p>
              <Button variant="secondary" size="sm" className="mt-3 w-full justify-start gap-2 border-black/5 bg-white" onClick={() => void handleLogout()}>
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-[#1d1d1f] p-4 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 size-20 rounded-full bg-[#16FF00]/20 blur-xl" />
            <p className="relative text-sm font-semibold">Need help?</p>
            <p className="relative mt-1 text-xs text-white/60">Guided DNS setup in under 3 minutes.</p>
            <Link href="/dashboard/support" className="relative mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1d1d1f]">
              Contact support
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between gap-3 border-b border-black/5 bg-white/70 backdrop-blur-xl px-4 lg:hidden">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#1d1d1f] text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </header>
        {mobileOpen ? (
          <div className="border-b border-black/5 bg-white p-4 lg:hidden">
            <div className="glass rounded-2xl p-3">{nav}</div>
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={() => void handleLogout()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        ) : null}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 bg-[#f5f5f7] min-h-[calc(100vh-56px)]">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

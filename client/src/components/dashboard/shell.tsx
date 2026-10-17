"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightLeft, CreditCard, Globe2, HelpCircle, LayoutDashboard, LogOut, Mail, Menu, Receipt, Settings, X } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/formatting";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/domains", label: "Domains", icon: Globe2 },
  { href: "/dashboard/mailboxes", label: "Email accounts", icon: Mail },
  { href: "/dashboard/forwarding", label: "Aliases & forwarding", icon: ArrowRightLeft },
  { href: "/dashboard/subscription", label: "Plan & subscription", icon: CreditCard },
  { href: "/dashboard/billing", label: "Billing", icon: Receipt },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (!loading && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [loading, session, router, pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  if (loading || !session) return <div className="grid min-h-screen place-items-center bg-background"><div className="size-7 animate-spin rounded-full border-2 border-accent border-r-transparent" /></div>;

  const signOut = async () => { await logout(); router.push("/login"); };
  const navigation = <nav className="space-y-1" aria-label="Dashboard navigation">
    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">Workspace</p>
    {NAV.map(({ href, label, icon: Icon }) => {
      const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/[0.07] hover:text-ink")}><Icon className={cn("size-4", active ? "text-accent" : "text-muted")} />{label}</Link>;
    })}
  </nav>;

  return <div className="min-h-screen bg-background text-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-border bg-surface-2 lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <Link href="/dashboard" className="px-2"><Logo /></Link>
        <div className="mt-9">{navigation}</div>
        <div className="mt-auto border-t border-border pt-4">
          <Link href="/dashboard/settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-white/[0.07]", pathname.startsWith("/dashboard/settings") && "bg-white/[0.07] text-ink")}><Settings className="size-4" />Settings</Link>
          <Link href="/dashboard/support" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-white/[0.07]"><HelpCircle className="size-4" />Support</Link>
          <div className="mt-5 rounded-xl border border-border bg-surface p-3"><p className="truncate text-xs font-semibold text-ink">{session.organization.name}</p><p className="mt-1 truncate text-xs text-muted">{session.user.email}</p><button type="button" onClick={() => void signOut()} className="mt-3 flex items-center gap-2 text-xs font-medium text-muted hover:text-ink"><LogOut className="size-3.5" />Sign out</button></div>
        </div>
      </div>
    </aside>
    <div className="lg:pl-[252px]">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:px-8"><Link href="/dashboard" className="lg:hidden"><Logo /></Link><div className="hidden lg:block"><p className="text-sm font-semibold">Workspace</p><p className="text-xs text-muted">Manage your business email</p></div><div className="flex items-center gap-3"><Link href="/dashboard/support" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">Need help?</Link><button type="button" className="grid size-9 place-items-center rounded-lg border border-border lg:hidden" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}</button></div></header>
      {mobileOpen && <div className="border-b border-border bg-surface-2 p-4 lg:hidden">{navigation}<Button variant="ghost" size="sm" className="mt-3" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</Button></div>}
      <main className="min-h-[calc(100vh-64px)] px-5 py-7 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  </div>;
}

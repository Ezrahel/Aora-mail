import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f5f5f7]">
      <div className="absolute inset-0 mesh-bg" aria-hidden />
      <div className="absolute -top-32 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-[#16FF00]/12 blur-3xl" aria-hidden />
      <div className="absolute top-32 -right-32 size-[520px] rounded-full bg-[#0A84FF]/10 blur-3xl" aria-hidden />

      <header className="relative z-10 mx-auto flex h-14 w-full max-w-lg items-center px-4">
        <Link href="/" className="flex items-center gap-2 rounded-full glass px-3 py-1.5 border border-white/60">
          <Logo />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-[440px] rounded-[32px] border border-white/60 bg-white/80 p-7 sm:p-8 shadow-float backdrop-blur-2xl">
          {children}
        </div>
      </main>

      <p className="relative z-10 pb-6 text-center text-xs text-[#86868b]">
        <Link href="/" className="rounded-full glass px-3 py-1 hover:bg-white/80 transition">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

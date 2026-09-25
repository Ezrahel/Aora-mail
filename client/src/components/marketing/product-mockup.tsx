"use client";

import { Check, Mail, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/effects/tilt-card";

export function ProductMockup() {
  return (
    <TiltCard className="relative">
      {/* Glow behind — Apple depth */}
      <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-[#16FF00]/20 via-[#0A84FF]/10 to-[#BF5AF2]/15 blur-3xl rounded-[40px]" aria-hidden />

      <motion.div
        initial={{ y: 20, opacity: 0, rotateX: 10 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-2xl shadow-float"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Window chrome — macOS */}
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-white/60 px-4 py-3 backdrop-blur">
          <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex items-center gap-2 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-medium text-[#1d1d1f]">
            <span className="size-2 rounded-full bg-[#16FF00] shadow-[0_0_6px_rgba(22,255,0,0.6)]" />
            yourcompany.ng
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-[#16FF00]/30 bg-[#16FF00]/10 px-2.5 py-1 text-xs font-medium text-[#0a1f0a] sm:flex">
            <Check className="size-3" />
            Domain connected
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {/* Stats — bento mini */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Mailboxes", value: "3", icon: Mail, tint: "bg-[#16FF00]/10 text-[#0a6600]" },
              { label: "Storage", value: "47%", icon: Zap, tint: "bg-[#0A84FF]/10 text-[#0A84FF]" },
              { label: "Security", value: "✓", icon: Shield, tint: "bg-[#BF5AF2]/10 text-[#BF5AF2]" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-black/5 bg-[#f5f5f7]/70 p-3">
                <div className={`inline-flex size-7 items-center justify-center rounded-full ${s.tint}`}>
                  <s.icon className="size-3.5" />
                </div>
                <p className="mt-2 text-xs font-medium text-[#86868b]">{s.label}</p>
                <p className="text-sm font-semibold text-[#1d1d1f]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mailboxes — liquid glass list */}
          <ul className="mt-4 space-y-2.5">
            {[
              { local: "info", role: "General", color: "#16FF00" },
              { local: "sales", role: "Revenue", color: "#0A84FF" },
              { local: "admin", role: "Operations", color: "#BF5AF2" },
            ].map((item, i) => (
              <motion.li
                key={item.local}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="group flex items-center justify-between rounded-2xl border border-black/5 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-black/10"
                style={{ transform: `translateZ(${12 + i * 4}px)` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    style={{ background: item.color }}
                  >
                    {item.local[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="font-mono text-sm font-medium text-[#1d1d1f]">{item.local}@yourcompany.ng</p>
                    <p className="text-xs text-[#86868b]">{item.role} · Active</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-[#16FF00]/10 px-2.5 py-1 text-xs font-medium text-[#0a6600] border border-[#16FF00]/20">
                  <span className="size-1.5 rounded-full bg-[#16FF00] shadow-[0_0_6px_rgba(22,255,0,0.6)] animate-pulse" />
                  Live
                </span>
              </motion.li>
            ))}
          </ul>

          {/* Bottom bar — Apple */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#1d1d1f] px-4 py-3 text-white">
            <p className="text-xs font-medium text-white/70">Next step</p>
            <p className="text-sm font-medium">DNS verified · Ready to send</p>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}

"use client";

import { motion } from "framer-motion";

// Mesh gradient background — inspired by johannschopplich/mesh-gradient
export function MeshGradient({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className={variant === "dark" ? "mesh-bg-dark absolute inset-0" : "mesh-bg absolute inset-0"} />
      {/* Animated orbs — Apple depth */}
      <motion.div
        animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 size-[560px] rounded-full bg-[#16FF00]/20 blur-[80px]"
        aria-hidden
      />
      <motion.div
        animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-20 -right-32 size-[520px] rounded-full bg-[#0A84FF]/15 blur-[80px]"
        aria-hidden
      />
      <motion.div
        animate={{ x: [0, 20, -15, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-0 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-[#BF5AF2]/10 blur-[100px]"
        aria-hidden
      />
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FBFBFD] to-[#F5F5F7]" />
      <motion.div
        className="absolute top-[8%] left-[12%] size-3 rounded-full bg-[#16FF00] shadow-[0_0_20px_rgba(22,255,0,0.5)]"
        animate={{ y: [0, -12, 0], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[18%] right-[15%] size-2 rounded-full bg-[#0A84FF]"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[20%] size-2.5 rounded-full bg-[#BF5AF2]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}

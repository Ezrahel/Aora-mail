"use client";

import { cn } from "@/lib/formatting";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Apple Liquid Glass — iOS 26 inspired
// Open-source refs: liquid-glass-react, mesh-gradient
export function LiquidGlass({
  children,
  className,
  intensity = "medium",
  tint,
}: {
  children: ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "strong";
  tint?: "green" | "blue" | "purple" | "orange" | "none";
}) {
  const intensityClass =
    intensity === "strong" ? "glass-strong" : intensity === "light" ? "glass" : "glass";

  const tintClass =
    tint === "green"
      ? "bg-[rgba(22,255,0,0.08)] border-[rgba(22,255,0,0.18)]"
      : tint === "blue"
        ? "bg-[rgba(10,132,255,0.08)] border-[rgba(10,132,255,0.18)]"
        : tint === "purple"
          ? "bg-[rgba(191,90,242,0.08)] border-[rgba(191,90,242,0.18)]"
          : "";

  return (
    <div className={cn(intensityClass, "rounded-[24px]", tintClass, className)}>
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "glass rounded-[24px] p-6 depth-1 transition-shadow duration-300",
        hover && "hover:depth-2 hover:shadow-float",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function BentoCard({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: "green" | "blue" | "purple" | "orange";
}) {
  const accentDot =
    accent === "green"
      ? "bg-[#16FF00] shadow-[0_0_12px_rgba(22,255,0,0.6)]"
      : accent === "blue"
        ? "bg-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.5)]"
        : accent === "purple"
          ? "bg-[#BF5AF2] shadow-[0_0_12px_rgba(191,90,242,0.5)]"
          : accent === "orange"
            ? "bg-[#FF9F0A] shadow-[0_0_12px_rgba(255,159,10,0.5)]"
            : "bg-[#16FF00]";

  return (
    <div className={cn("glass rounded-[32px] p-7 relative overflow-hidden depth-1", className)}>
      <div
        className={cn("absolute top-6 right-6 size-2 rounded-full", accentDot)}
        aria-hidden
      />
      {children}
    </div>
  );
}

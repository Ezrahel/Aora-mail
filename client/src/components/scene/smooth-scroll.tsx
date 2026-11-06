"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Inertial scrolling for marketing pages only; app screens stay native. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: true });
    return () => lenis.destroy();
  }, []);
  return null;
}

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { SpiralMark } from "@/components/brand/spiral-mark";
import { cn } from "@/lib/formatting";
import { usePrefersStillness } from "@/lib/scene/motion";

const SpiralCanvas = dynamic(() => import("./spiral-canvas"), { ssr: false });

const subscribeNever = () => () => {};

function supportsWebgl() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * The shared 3D layer. The canvas loads after the page and never blocks
 * content; without WebGL2 the brand mark stands in for it.
 */
export function SpiralBackdrop({ pinnedScene, contained = false, poseOverride, className }: {
  pinnedScene?: number;
  contained?: boolean;
  poseOverride?: { x?: number; y?: number; scale?: number; tiltX?: number; tiltY?: number; opacity?: number };
  className?: string;
}) {
  const pathname = usePathname();
  const webgl = useSyncExternalStore(subscribeNever, supportsWebgl, () => null);
  const still = usePrefersStillness();

  return (
    <div aria-hidden className={cn("pointer-events-none overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0 z-0", className)}>
      {webgl === false ? (
        <SpiralMark className="absolute right-[-6%] top-1/2 size-[min(70vw,640px)] -translate-y-1/2 text-accent opacity-20" />
      ) : null}
      {webgl ? <div className="scene-fade-in size-full"><SpiralCanvas pinnedScene={pinnedScene} routeKey={pathname} still={still} poseOverride={poseOverride} /></div> : null}
    </div>
  );
}

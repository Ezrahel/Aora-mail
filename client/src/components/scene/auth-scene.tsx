"use client";

import { useSyncExternalStore } from "react";
import { SCENES } from "@/lib/scene/store";
import { SpiralBackdrop } from "./spiral-backdrop";

const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const POSE = { x: 0, y: 0.72, scale: 1.2, tiltX: 0.04, tiltY: -0.24, opacity: 1 };

/** The panel is hidden on phones, so there the GPU work never starts at all. */
export function AuthScene() {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return wide ? <SpiralBackdrop contained pinnedScene={SCENES.address} poseOverride={POSE} /> : null;
}

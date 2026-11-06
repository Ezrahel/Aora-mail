import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Hydration-safe reduced-motion flag: it reports false on the server and for
 * the first client render, then settles. Framer's own hook reads the media
 * query during that first render, which disagrees with the server HTML.
 */
export function usePrefersStillness() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

import { useSyncExternalStore } from "react";

export const DEFAULT_DOMAIN = "yourcompany.ng";
const PENDING_KEY = "aora.pendingDomain";

let current = "";
const listeners = new Set<() => void>();

/** Reduces whatever was typed or pasted to a plausible hostname. */
export function cleanDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^.*@/, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "")
    .slice(0, 63);
}

/** "acme" previews as acme.ng; anything already carrying a dot is left alone. */
export function previewDomain(input: string) {
  const clean = cleanDomain(input).replace(/\.+$/, "");
  if (!clean) return DEFAULT_DOMAIN;
  return clean.includes(".") ? clean : `${clean}.ng`;
}

export function setTypedDomain(value: string) {
  current = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The visitor's domain, shared by the hero and the zone editor further down. */
export function useTypedDomain() {
  return useSyncExternalStore(subscribe, () => current, () => "");
}

/** Hands the domain to onboarding so it never has to be typed twice. */
export function rememberPendingDomain(domain: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, domain);
  } catch {
    // Storage can be blocked; the customer simply types it again in onboarding.
  }
}

export function readPendingDomain() {
  try {
    return sessionStorage.getItem(PENDING_KEY) ?? "";
  } catch {
    return "";
  }
}

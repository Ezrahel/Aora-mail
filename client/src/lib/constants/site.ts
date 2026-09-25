export const SITE = {
  name: "Aora",
  legalName: "Aora Mail",
  tagline: "Professional email for businesses that mean business.",
  description:
    "Get reliable business email at your own domain — without paying for an entire office suite.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aora.ng",
  supportEmail: "support@aora.ng",
  locale: "en-NG",
  currency: "NGN",
} as const;

export const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
] as const;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** When true, the typed API client uses in-browser mock adapters. */
export const USE_MOCK_API =
  process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

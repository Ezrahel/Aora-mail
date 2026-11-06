import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Aora pricing: clear yearly plans, priced in Naira";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "Pricing", title: "Clear yearly plans, priced in Naira." });
}

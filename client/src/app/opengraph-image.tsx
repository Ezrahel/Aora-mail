import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Aora: email that looks like your business";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "Business email, made clear", title: "Email that looks like your business." });
}

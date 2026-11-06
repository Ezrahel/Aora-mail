import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Aora FAQ: straight answers about business email";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "FAQ", title: "Straight answers about business email." });
}

import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/seo/og-image";

export const alt = "How Aora works: four steps from signup to a working inbox";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "How it works", title: "Four steps from signup to a working inbox." });
}

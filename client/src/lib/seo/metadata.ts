import type { Metadata } from "next";
import { SITE } from "@/lib/constants/site";

const SHARED_CARD = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}: email that looks like your business`,
};

/**
 * Metadata for a public page. Next replaces `openGraph` and `twitter` wholesale
 * rather than merging them with the root layout, so each page sets them all.
 */
export function publicPage({ title, description, path, absoluteTitle = false, sharedCard = false }: {
  title: string;
  description: string;
  path: string;
  /** Skips the " | Aora" suffix, for titles that already carry the brand. */
  absoluteTitle?: boolean;
  /**
   * For pages without an opengraph-image file of their own. Setting `openGraph`
   * here stops them inheriting the root card, so it has to be named outright.
   */
  sharedCard?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  const images = sharedCard ? { images: [SHARED_CARD] } : {};
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_NG",
      siteName: SITE.name,
      url: path,
      title: fullTitle,
      description,
      ...images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, ...images },
  };
}

/** For account and app screens: useful to people, of no value in search. */
export function privatePage(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}

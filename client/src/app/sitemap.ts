import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

/** Only the pages worth finding in search; account screens are noindex. */
const ROUTES = ["", "/pricing", "/how-it-works", "/faq", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE.url}${path}` }));
}

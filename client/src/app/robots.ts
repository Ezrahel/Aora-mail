import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/onboarding"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

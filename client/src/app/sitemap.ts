import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const routes = ["", "/pricing", "/how-it-works", "/faq", "/login", "/register"];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}

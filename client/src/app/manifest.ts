import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.legalName,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c0b",
    theme_color: "#0a0c0b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

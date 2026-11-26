import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#E8EFE2",
    theme_color: "#22262B",
    icons: [
      { src: "/brand/mark-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/mark-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/booking",
  "/contact",
  "/shop",
  "/reviews",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [];
  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${base}/nl${path}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          nl: `${base}/nl${path}`,
          en: `${base}/en${path}`,
        },
      },
    });
  }
  for (const service of SERVICES) {
    entries.push({
      url: `${base}/nl/services/${service.slug}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          nl: `${base}/nl/services/${service.slug}`,
          en: `${base}/en/services/${service.slug}`,
        },
      },
    });
  }
  return entries;
}

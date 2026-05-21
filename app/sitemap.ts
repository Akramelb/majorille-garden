import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/content";
import { siteUrl } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";

const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/booking",
  "/contact",
  "/shop",
  "/reviews",
  "/journal",
  "/privacy",
  "/terms",
];

function entry(base: string, path: string, lastModified: Date = new Date()) {
  return {
    url: `${base}/nl${path}`,
    lastModified,
    alternates: {
      languages: {
        nl: `${base}/nl${path}`,
        en: `${base}/en${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => entry(base, p));

  for (const service of SERVICES) {
    entries.push(entry(base, `/services/${service.slug}`));
  }

  const posts = await getPublishedPosts();
  for (const post of posts) {
    entries.push(entry(base, `/journal/${post.slug}`, new Date(post.updated_at)));
  }

  return entries;
}

import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/content";
import { siteUrl } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";

type StaticEntry = {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

// Public, indexable routes only — admin/auth/api are excluded by robots.ts
// and never appear here. Checkout / return pages are noindex by metadata.
const STATIC_PATHS: StaticEntry[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/booking", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/reviews", changeFrequency: "weekly", priority: 0.6 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

function entry(
  base: string,
  path: string,
  opts: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: `${base}/nl${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
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
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, changeFrequency, priority }) =>
    entry(base, path, { changeFrequency, priority }),
  );

  for (const service of SERVICES) {
    entries.push(
      entry(base, `/services/${service.slug}`, {
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    );
  }

  const posts = await getPublishedPosts();
  for (const post of posts) {
    entries.push(
      entry(base, `/journal/${post.slug}`, {
        lastModified: new Date(post.updated_at),
        changeFrequency: "monthly",
        priority: 0.5,
      }),
    );
  }

  return entries;
}

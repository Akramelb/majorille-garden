import type { Metadata } from "next";
import type { Locale } from "@/app/[lang]/dictionaries";
import { SITE } from "./content";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.majorillegarden.nl";

export type PageSeoInput = {
  locale: Locale;
  /** Path WITHOUT locale prefix, e.g. "/about", "/services/bio-head-spa" */
  path: string;
  title: string;
  description: string;
  /** Absolute or root-relative image URL for OG/Twitter. Defaults to the
   * per-locale ImageResponse route at `/<locale>/opengraph-image`. */
  image?: string;
  /** Open Graph type. Defaults to "website"; pass "article" for blog posts. */
  type?: "website" | "article";
  /** Pass `false` to mark the page noindex/nofollow (e.g. checkout, return). */
  index?: boolean;
  /** Article-only metadata; ignored for `type: "website"`. */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
};

function toAbsolute(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  index = true,
  article,
}: PageSeoInput): Metadata {
  const canonical = `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
  const altNl = `${SITE_URL}/nl${path === "/" ? "" : path}`;
  const altEn = `${SITE_URL}/en${path === "/" ? "" : path}`;
  // Default to the per-locale ImageResponse route so every page gets a
  // valid OG image without callers having to opt in.
  const ogImage = toAbsolute(image ?? `/${locale}/opengraph-image`);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        nl: altNl,
        en: altEn,
        "x-default": altNl,
      },
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: locale === "nl" ? "nl_NL" : "en_US",
      alternateLocale: locale === "nl" ? "en_US" : "nl_NL",
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === "article" && article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function siteUrl(): string {
  return SITE_URL;
}

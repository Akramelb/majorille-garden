import type { Metadata } from "next";
import type { Locale } from "@/app/[lang]/dictionaries";
import { SITE } from "./content";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.majorillegarden.nl";

export type PageSeoInput = {
  locale: Locale;
  path: string; // path WITHOUT locale prefix, e.g. "/about", "/services/bio-head-spa"
  title: string;
  description: string;
  image?: string;
};

export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
}: PageSeoInput): Metadata {
  const canonical = `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
  const altNl = `${SITE_URL}/nl${path === "/" ? "" : path}`;
  const altEn = `${SITE_URL}/en${path === "/" ? "" : path}`;
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
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: locale === "nl" ? "nl_NL" : "en_US",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function siteUrl(): string {
  return SITE_URL;
}

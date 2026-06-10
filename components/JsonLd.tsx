import { SITE, localized, type Service, type FAQ } from "@/lib/content";
import { siteUrl } from "@/lib/seo";
import type { Locale } from "@/app/[lang]/dictionaries";

export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: SITE.name,
    image: [
      `${siteUrl()}/images/home/hero-promo.jpg`,
      `${siteUrl()}/images/home/hero.jpg`,
    ],
    "@id": `${siteUrl()}/#business`,
    url: siteUrl(),
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      postalCode: "1087 HN",
      addressLocality: "Amsterdam",
      addressRegion: "Noord-Holland",
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 52.3501,
      longitude: 4.9686,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "20:00",
        description: localized(SITE.hours.women.range, locale),
      },
    ],
    areaServed: { "@type": "City", name: "Amsterdam" },
    // Reads any non-empty url from SITE.socials so adding TikTok/Facebook
    // later is one line in lib/content.ts — no schema edit needed. SITE is
    // `as const`, so the values come back as literal-typed strings; cast to
    // a plain string array for the schema.org consumer.
    sameAs: (Object.values(SITE.socials) as string[]).filter(
      (u) => typeof u === "string" && u.length > 0,
    ),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ServiceJsonLd({
  service,
  locale,
}: {
  service: Service;
  locale: Locale;
}) {
  const cheapest = service.variants.reduce(
    (min, v) => (v.priceCents < min.priceCents ? v : min),
    service.variants[0],
  );
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: localized(service.name, locale),
    description: localized(service.tagline, locale),
    image: `${siteUrl()}${service.heroImage}`,
    serviceType: localized(service.name, locale),
    url: `${siteUrl()}/${locale}/services/${service.slug}`,
    provider: {
      "@type": "HealthAndBeautyBusiness",
      name: SITE.name,
      url: siteUrl(),
      telephone: SITE.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE.address.street,
        postalCode: "1087 HN",
        addressLocality: "Amsterdam",
        addressCountry: "NL",
      },
    },
    areaServed: { "@type": "City", name: "Amsterdam" },
    offers: {
      "@type": "Offer",
      price: (cheapest.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl()}/${locale}/services/${service.slug}`,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * FAQPage schema — accepts the FAQ shape from lib/content.ts so the home page
 * can render rich-result eligible FAQ markup alongside the visible accordion.
 */
export function FAQJsonLd({
  faqs,
  locale,
}: {
  faqs: ReadonlyArray<FAQ>;
  locale: Locale;
}) {
  if (faqs.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: localized(f.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: localized(f.answer, locale),
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

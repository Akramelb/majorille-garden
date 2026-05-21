import { SITE, localized, type Service } from "@/lib/content";
import { siteUrl } from "@/lib/seo";
import type { Locale } from "@/app/[lang]/dictionaries";

export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: SITE.name,
    image: `${siteUrl()}/images/home/hero-promo.png`,
    "@id": siteUrl(),
    url: siteUrl(),
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      postalCode: "1087 HN",
      addressLocality: "Amsterdam",
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
    sameAs: [],
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
    provider: {
      "@type": "HealthAndBeautyBusiness",
      name: SITE.name,
      url: siteUrl(),
    },
    areaServed: { "@type": "City", name: "Amsterdam" },
    offers: {
      "@type": "Offer",
      price: (cheapest.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
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

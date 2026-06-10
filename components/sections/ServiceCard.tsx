import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/lib/content";
import { localized, formatPriceEUR } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";

export function ServiceCard({
  service,
  locale,
  fromLabel,
  minutesLabel,
}: {
  service: Service;
  locale: Locale;
  fromLabel: string;
  minutesLabel: string;
}) {
  const cheapest = service.variants.reduce(
    (min, v) => (v.priceCents < min.priceCents ? v : min),
    service.variants[0],
  );
  return (
    <Link
      href={`/${locale}/services/${service.slug}`}
      className="group block"
    >
      <div className="arch-frame relative aspect-[3/4] overflow-hidden bg-sand/30">
        <Image
          src={service.cardImage}
          alt={localized(service.name, locale)}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-6">
        <h3 className="serif text-2xl lg:text-[1.7rem] text-deep-brown leading-tight group-hover:text-majorelle transition-colors duration-300">
          {localized(service.name, locale)}
        </h3>
        <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
          {localized(service.tagline, locale)}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-terracotta">
          {fromLabel} {formatPriceEUR(cheapest.priceCents, locale)}
          <span className="text-muted ml-2 normal-case tracking-normal">
            · {cheapest.durationMin} {minutesLabel}
          </span>
        </p>
      </div>
    </Link>
  );
}

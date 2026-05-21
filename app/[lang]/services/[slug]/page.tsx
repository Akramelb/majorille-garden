import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import {
  SERVICES,
  getServiceBySlug,
  localized,
  formatPriceEUR,
} from "@/lib/content";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getDictionary, hasLocale, LOCALES } from "../../dictionaries";
import { buildMetadata } from "@/lib/seo";
import { ServiceJsonLd } from "@/components/JsonLd";

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    SERVICES.map((s) => ({ lang, slug: s.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[lang]/services/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const name = localized(service.name, lang);
  const tagline = localized(service.tagline, lang);
  return buildMetadata({
    locale: lang,
    path: `/services/${slug}`,
    title: `${name} · Majorille Garden`,
    description: tagline,
  });
}

export default async function ServicePage(
  props: PageProps<"/[lang]/services/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <ServiceJsonLd service={service} locale={lang} />
      {/* HERO */}
      <section className="pt-12 lg:pt-20 pb-16 lg:pb-28">
        <Container>
          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-xs uppercase tracking-[0.22em] text-muted"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={`/${lang}`} className="hover:text-deep-brown">
                  {dict.nav.home}
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li>
                <Link
                  href={`/${lang}/services`}
                  className="hover:text-deep-brown"
                >
                  {dict.nav.services}
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li className="text-deep-brown" aria-current="page">
                {localized(service.name, lang)}
              </li>
            </ol>
          </nav>
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
            <div>
              <Eyebrow>{dict.servicesSection.eyebrow}</Eyebrow>
              <h1 className="display mt-6 text-5xl lg:text-6xl xl:text-7xl text-deep-brown">
                {localized(service.name, lang)}
              </h1>
              <p className="mt-6 text-xl text-muted leading-relaxed">
                {localized(service.tagline, lang)}
              </p>
              {localized(service.intro, lang).map((p, i) => (
                <p
                  key={i}
                  className="mt-5 text-lg text-muted leading-relaxed"
                >
                  {p}
                </p>
              ))}

              {/* Pricing */}
              <div className="mt-10 p-6 lg:p-8 bg-cream border border-border/60">
                <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-4">
                  {lang === "nl" ? "Tarieven" : "Pricing"}
                </p>
                <ul className="divide-y divide-border/50">
                  {service.variants.map((v, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="serif text-lg text-deep-brown">
                          {localized(v.label, lang)}
                        </p>
                        <p className="text-xs text-muted">
                          {v.durationMin} {dict.servicesSection.minutes} ·{" "}
                          {dict.servicesSection.incl}
                        </p>
                      </div>
                      <p className="serif text-2xl text-deep-brown">
                        {formatPriceEUR(v.priceCents, lang)}
                      </p>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${lang}/booking?service=${service.slug}`}
                  className="btn-primary mt-6 w-full"
                >
                  {dict.servicesSection.bookCta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/5] lg:aspect-[3/4]">
              <Image
                src={service.heroImage}
                alt={localized(service.name, lang)}
                fill
                priority
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* SECTIONS */}
      {service.sections.map((section, i) => (
        <section
          key={i}
          className={i % 2 === 0 ? "py-24 lg:py-36 bg-sand/25" : "py-24 lg:py-36"}
        >
          <Container>
            <div
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              {section.image ? (
                <div className="relative aspect-[5/4]">
                  <Image
                    src={section.image}
                    alt={localized(section.title, lang)}
                    fill
                    sizes="(min-width:1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="hidden lg:block" />
              )}
              <div>
                <h2 className="display text-4xl lg:text-5xl text-deep-brown">
                  {localized(section.title, lang)}
                </h2>
                {localized(section.body, lang).map((p, j) => (
                  <p
                    key={j}
                    className="mt-5 text-lg text-muted leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </Container>
        </section>
      ))}

      {/* GALLERY */}
      {service.galleryImages.length > 0 && (
        <section className="py-16 lg:py-24">
          <Container>
            <div
              className={`grid gap-3 ${
                service.galleryImages.length >= 4
                  ? "grid-cols-2 lg:grid-cols-4"
                  : service.galleryImages.length === 3
                    ? "grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {service.galleryImages.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square bg-sand/20 overflow-hidden group"
                >
                  <Image
                    src={src}
                    alt={`${localized(service.name, lang)} — ${i + 1}`}
                    fill
                    sizes="(min-width:1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CLOSING QUOTE + CTA */}
      <section className="py-28 lg:py-44 bg-deep-brown text-cream riad-trellis-dark">
        <Container size="md">
          {service.closingQuote && (
            <blockquote className="display text-3xl lg:text-5xl text-cream leading-[1.2] text-center max-w-3xl mx-auto">
              &ldquo;{localized(service.closingQuote, lang)}&rdquo;
            </blockquote>
          )}
          <div className="mt-12 flex justify-center">
            <Link
              href={`/${lang}/booking?service=${service.slug}`}
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-cream px-8 py-4 text-sm uppercase tracking-[0.18em] transition-colors"
            >
              {dict.servicesSection.bookCta}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

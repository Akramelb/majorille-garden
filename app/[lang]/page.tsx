import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import {
  SERVICES,
  FAQS,
  TESTIMONIAL,
  PRODUCTS,
  ABOUT,
  localized,
  formatPriceEUR,
} from "@/lib/content";
import { Container, Eyebrow } from "@/components/ui/Container";
import { FAQAccordion } from "@/components/sections/FAQAccordion";
import { ContactForm } from "@/components/sections/ContactForm";
import { NewsletterForm } from "@/components/sections/NewsletterForm";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(
  props: PageProps<"/[lang]">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/",
    title:
      lang === "nl"
        ? "Majorille Garden · Marokkaanse wellness in Amsterdam"
        : "Majorille Garden · Moroccan wellness in Amsterdam",
    description:
      lang === "nl"
        ? "Marokkaans geïnspireerde wellness in Amsterdam: warme zandbad-therapie, bio head spa, traditionele massage, kruidenstempel en biologische producten."
        : "Moroccan-inspired wellness in Amsterdam: warm sand bath therapy, bio head spa, traditional massage, herbal stamp and organic products.",
  });
}

export default async function Home(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* HERO — full-bleed image, copy overlaid */}
      <section className="relative -mt-[76px] lg:-mt-[88px] h-[100svh] min-h-[640px] w-full overflow-hidden">
        <Image
          src="/images/home/hero.jpg"
          alt="A woman in white tosses arcs of warm Saharan sand at sunset"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Gradients: top for header legibility, bottom for copy legibility */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-deep-brown/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-deep-brown/80 via-deep-brown/30 to-transparent" />

        <Container className="absolute inset-x-0 bottom-0 pb-20 lg:pb-28">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-cream/85">
              {dict.hero.eyebrow}
            </p>
            <h1 className="display mt-6 text-cream text-5xl sm:text-6xl lg:text-7xl xl:text-[5.75rem]">
              {dict.hero.title}
            </h1>
            <p className="mt-8 text-base lg:text-lg text-cream/80 leading-relaxed max-w-xl">
              {dict.hero.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <Link href={`/${lang}/booking`} className="btn-primary bg-cream text-deep-brown hover:bg-terracotta hover:text-cream">
                {dict.hero.ctaPrimary}
              </Link>
              <Link href={`/${lang}/services`} className="link-edit link-edit--light">
                {dict.hero.ctaSecondary}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* INTRO — quiet editorial paragraph, lots of whitespace */}
      <section className="py-32 lg:py-48 riad-trellis-light">
        <Container size="md">
          <div className="max-w-3xl mx-auto text-center">
            <Eyebrow>{dict.intro.eyebrow}</Eyebrow>
            <h2 className="display mt-8 text-4xl lg:text-6xl text-deep-brown">
              {dict.intro.title}
            </h2>
            <p className="mt-10 text-lg lg:text-xl text-muted leading-[1.75]">
              {dict.intro.body}
            </p>
          </div>
        </Container>
      </section>

      {/* RITUALS RAIL — horizontal scroll, large image tiles */}
      <section className="pb-32 lg:pb-48">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 lg:mb-20">
            <div className="max-w-xl">
              <Eyebrow>{dict.servicesSection.eyebrow}</Eyebrow>
              <h2 className="display mt-6 text-4xl lg:text-5xl text-deep-brown">
                {dict.servicesSection.title}
              </h2>
              <p className="mt-6 text-muted text-lg leading-relaxed">
                {dict.servicesSection.subtitle}
              </p>
            </div>
            <Link
              href={`/${lang}/services`}
              className="link-edit self-start lg:self-auto"
            >
              {dict.servicesSection.viewAll}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Container>

        {/* Rail breaks out of container for full-bleed scroll */}
        <div className="rail container-px mx-auto w-full max-w-[1400px]">
          {SERVICES.map((s) => {
            const cheapest = s.variants.reduce(
              (min, v) => (v.priceCents < min.priceCents ? v : min),
              s.variants[0],
            );
            return (
              <Link
                key={s.slug}
                href={`/${lang}/services/${s.slug}`}
                className="group block w-[78vw] sm:w-[52vw] md:w-[42vw] lg:w-[28rem]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-sand/30">
                  <Image
                    src={s.cardImage}
                    alt={localized(s.name, lang)}
                    fill
                    sizes="(min-width:1024px) 28rem, (min-width:640px) 52vw, 78vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-6">
                  <h3 className="serif text-2xl lg:text-[1.7rem] text-deep-brown leading-tight">
                    {localized(s.name, lang)}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                    {localized(s.tagline, lang)}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-terracotta">
                    {dict.servicesSection.from}{" "}
                    {formatPriceEUR(cheapest.priceCents, lang)}
                    <span className="text-muted ml-2 normal-case tracking-normal">
                      · {cheapest.durationMin} {dict.servicesSection.minutes}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ABOUT — editorial split, no decorative blocks */}
      <section className="py-32 lg:py-48 bg-sand/25">
        <Container>
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-6 relative aspect-[4/5] order-2 lg:order-1">
              <Image
                src="/images/about/hero.png"
                alt="Majorille Garden interior"
                fill
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-6 lg:pl-8 order-1 lg:order-2">
              <Eyebrow>{dict.about.eyebrow}</Eyebrow>
              <h2 className="display mt-6 text-4xl lg:text-5xl text-deep-brown">
                {dict.about.title}
              </h2>
              {localized(ABOUT.hero, lang).map((p, i) => (
                <p key={i} className="mt-6 text-lg text-muted leading-[1.75]">
                  {p}
                </p>
              ))}
              <Link
                href={`/${lang}/about`}
                className="link-edit mt-12 inline-flex"
              >
                {dict.about.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* PRODUCTS — dark section, stripped of card chrome */}
      <section className="py-32 lg:py-48 bg-deep-brown text-cream riad-trellis-dark">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 lg:mb-20">
            <div className="max-w-xl">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-terracotta">
                {dict.products.eyebrow}
              </p>
              <h2 className="display mt-6 text-4xl lg:text-5xl text-cream">
                {dict.products.title}
              </h2>
              <p className="mt-6 text-cream/70 text-lg leading-relaxed">
                {dict.products.subtitle}
              </p>
            </div>
            <Link
              href={`/${lang}/shop`}
              className="link-edit link-edit--light self-start lg:self-auto"
            >
              {dict.products.viewAll}
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {PRODUCTS.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/${lang}/shop`}
                className="group block"
              >
                <div className="relative aspect-[4/5] bg-cream/5 overflow-hidden">
                  <Image
                    src={p.image}
                    alt={localized(p.name, lang)}
                    fill
                    sizes="(min-width:1024px) 30vw, 50vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                  />
                </div>
                <h3 className="mt-5 serif text-xl lg:text-2xl text-cream">
                  {localized(p.name, lang)}
                </h3>
                <p className="mt-2 text-sm text-cream/60 leading-relaxed">
                  {localized(p.shortDescription, lang)}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-32 lg:py-48 bg-cream">
        <Container size="md">
          <div className="text-center">
            <Eyebrow>{dict.testimonial.eyebrow}</Eyebrow>
            <blockquote className="mt-10 display text-3xl lg:text-5xl text-deep-brown leading-[1.2] max-w-4xl mx-auto">
              &ldquo;{localized(TESTIMONIAL.quote, lang)}&rdquo;
            </blockquote>
            <p className="mt-12 text-[0.72rem] uppercase tracking-[0.32em] text-terracotta">
              — {TESTIMONIAL.author}
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-32 lg:py-40 bg-sand/30">
        <Container size="md">
          <div className="mb-16 text-center">
            <Eyebrow>{dict.faq.eyebrow}</Eyebrow>
            <h2 className="display mt-6 text-4xl lg:text-5xl text-deep-brown">
              {dict.faq.title}
            </h2>
          </div>
          <FAQAccordion faqs={FAQS} locale={lang} />
        </Container>
      </section>

      {/* CONTACT + NEWSLETTER */}
      <section className="py-32 lg:py-48">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <Eyebrow>{dict.contactSection.eyebrow}</Eyebrow>
              <h2 className="display mt-6 text-4xl lg:text-5xl text-deep-brown">
                {dict.contactSection.title}
              </h2>
              <p className="mt-6 text-muted text-lg max-w-md leading-relaxed">
                {dict.contactSection.subtitle}
              </p>
              <div className="mt-16">
                <NewsletterForm dict={dict.newsletter} />
              </div>
            </div>
            <div>
              <ContactForm dict={dict.contactSection} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

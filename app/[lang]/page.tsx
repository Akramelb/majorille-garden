import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import {
  SERVICES,
  TESTIMONIAL,
  PRODUCTS,
  ABOUT,
  SITE,
  localized,
  formatPriceEUR,
} from "@/lib/content";
import { getActiveFAQs } from "@/lib/faqs";
import { getHeroImageUrl } from "@/lib/site-settings";
import { Container, Eyebrow } from "@/components/ui/Container";
import { FAQAccordion } from "@/components/sections/FAQAccordion";
import { ContactForm } from "@/components/sections/ContactForm";
import { NewsletterForm } from "@/components/sections/NewsletterForm";
import { buildMetadata } from "@/lib/seo";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews";
import { ReviewsList } from "@/components/sections/ReviewsList";
import { StarRating } from "@/components/sections/StarRating";
import { RailControls } from "@/components/sections/RailControls";
import { FAQJsonLd } from "@/components/JsonLd";
import { isVacationActive } from "@/lib/vacation";

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
  const [reviews, stats, faqs, heroHome, heroAbout] = await Promise.all([
    getApprovedReviews(3),
    getReviewStats(),
    getActiveFAQs(),
    getHeroImageUrl("home"),
    getHeroImageUrl("about"),
  ]);

  // The home page renders the same ContactForm as /contact, so it needs the
  // same vacation-aware success copy (no "within 24 hours" while the owners
  // are away). Mirrors app/[lang]/contact/page.tsx.
  const vacation = isVacationActive();
  const contactDict = vacation
    ? { ...dict.contactSection, success: dict.vacation.contactSuccess }
    : dict.contactSection;

  // Editorial accent: lift the brand name out of the hero headline so it reads
  // as a signature. Works in both locales — the string always contains it.
  const heroBrand = "Majorille Garden";
  const heroTitle = dict.hero.title;
  const heroBrandIdx = heroTitle.indexOf(heroBrand);

  return (
    <>
      <FAQJsonLd faqs={faqs} locale={lang} />
      {/* HERO — full-bleed image, copy overlaid */}
      <section className="relative -mt-[calc(76px+var(--bar-h))] lg:-mt-[calc(88px+var(--bar-h))] h-[100svh] min-h-[560px] sm:min-h-[640px] w-full overflow-hidden">
        <Image
          src={heroHome}
          alt={
            lang === "nl"
              ? "Een vrouw in het wit werpt bogen van warm Saharazand op tijdens zonsondergang"
              : "A woman in white tosses arcs of warm Saharan sand at sunset"
          }
          fill
          priority
          sizes="100vw"
          className="object-cover hero-drift"
        />
        {/* Gradients: top for header legibility, bottom for copy legibility */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-deep-brown/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-deep-brown/80 via-deep-brown/30 to-transparent" />

        <Container className="absolute inset-x-0 bottom-0 pb-14 sm:pb-20 lg:pb-28">
          <div className="max-w-4xl">
            <div className="reveal flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-cream/85">
                {dict.hero.eyebrow}
              </p>
            </div>
            <h1 className="reveal reveal-2 display mt-5 sm:mt-7 text-balance text-cream text-[2.5rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] [text-shadow:0_2px_28px_rgba(42,24,16,0.3)]">
              {heroBrandIdx === -1 ? (
                heroTitle
              ) : (
                <>
                  {heroTitle.slice(0, heroBrandIdx)}
                  <span className="italic text-gold">{heroBrand}</span>
                  {heroTitle.slice(heroBrandIdx + heroBrand.length)}
                </>
              )}
            </h1>
            <p className="reveal reveal-3 mt-6 sm:mt-8 text-base lg:text-lg text-cream/80 leading-relaxed max-w-xl text-balance">
              {dict.hero.subtitle}
            </p>
            <div className="reveal reveal-4 mt-8 sm:mt-10 flex flex-wrap items-center gap-5 sm:gap-8">
              <Link href={`/${lang}/booking`} className="btn-primary btn-primary--cream">
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

      {/* SOCIAL DEAL PROMO — between hero and intro */}
      <section className="py-16 lg:py-24 bg-sand/40 border-y border-terracotta/20">
        <Container size="md">
          <div className="max-w-2xl mx-auto text-center reveal-scroll">
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-terracotta">
              {dict.socialDeal.eyebrow}
            </p>
            <h2 className="display mt-5 text-3xl lg:text-4xl text-deep-brown">
              {dict.socialDeal.title}
            </h2>
            <p className="mt-5 text-muted text-base lg:text-lg leading-relaxed">
              {dict.socialDeal.body}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-8">
              <a
                href={`${SITE.whatsappLink}?text=${encodeURIComponent(dict.socialDeal.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                {dict.socialDeal.ctaWhatsapp}
              </a>
              {SITE.socialDealUrl && (
                <a
                  href={SITE.socialDealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-edit"
                >
                  {dict.socialDeal.ctaView}
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* INTRO — quiet editorial paragraph, lots of whitespace */}
      <section className="py-32 lg:py-48 riad-trellis-light">
        <Container size="md">
          <div className="max-w-3xl mx-auto text-center reveal-scroll">
            <Eyebrow>{dict.intro.eyebrow}</Eyebrow>
            <h2 className="display mt-8 text-4xl lg:text-6xl text-deep-brown">
              {dict.intro.title}
            </h2>
            <p className="mt-10 text-lg lg:text-xl text-muted leading-[1.75]">
              {dict.intro.body}
            </p>
            <div className="tile-rule mt-14 max-w-xs mx-auto" aria-hidden="true">
              <i /><i /><i />
            </div>
          </div>
        </Container>
      </section>

      {/* LOYALTY PACKAGES — 2 combo offers */}
      <section className="relative overflow-hidden bg-deep-brown py-24 lg:py-32 dusk-glow">
        <div className="brand-hairline" />
        <Container>
          {/* section header */}
          <div className="text-center mb-16 lg:mb-20 reveal-scroll">
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-terracotta">
              {dict.loyaltySection.eyebrow}
            </p>
            <h2 className="display mt-5 text-3xl sm:text-4xl lg:text-5xl text-cream">
              {dict.loyaltySection.title}
            </h2>
            <p className="mt-5 text-cream/55 text-lg max-w-md mx-auto">
              {dict.loyaltySection.subtitle}
            </p>
          </div>

          {/* cards */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
            {/* card 1 — Meridianen */}
            <div className="reveal-scroll border border-gold/20 p-8 lg:p-10 flex flex-col">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-terracotta">
                {dict.promo.badge}
              </p>
              <div className="mt-4 flex items-baseline gap-3 select-none">
                <span className="display text-[4rem] lg:text-[5rem] text-gold leading-[0.85] tabular-nums">
                  6+1
                </span>
                <span className="display text-xl text-cream/45 italic">
                  {dict.promo.dealLabel}
                </span>
              </div>
              <h3 className="mt-5 display text-2xl lg:text-[1.8rem] text-cream leading-tight">
                {dict.promo.title}
              </h3>
              <p className="mt-3 serif italic text-gold text-lg leading-snug">
                {dict.promo.tagline}
              </p>
              <p className="mt-4 text-cream/60 leading-relaxed text-sm lg:text-base flex-1">
                {dict.promo.body}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <a
                  href={SITE.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-primary--cream"
                >
                  {dict.promo.cta}
                </a>
                <span className="text-xl serif text-cream/75">{dict.promo.price}</span>
              </div>
            </div>

            {/* card 2 — Ma Jolie (Bio head spa + Kruidenstempel) */}
            <div className="reveal-scroll border border-gold/20 p-8 lg:p-10 flex flex-col">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-terracotta">
                {dict.promoB.badge}
              </p>
              <div className="mt-4 flex items-baseline gap-3 select-none">
                <span className="display text-[4rem] lg:text-[5rem] text-gold leading-[0.85] tabular-nums">
                  6+1
                </span>
                <span className="display text-xl text-cream/45 italic">
                  {dict.promoB.dealLabel}
                </span>
              </div>
              <h3 className="mt-5 display text-2xl lg:text-[1.8rem] text-cream leading-tight">
                {dict.promoB.title}
              </h3>
              <p className="mt-3 serif italic text-gold text-lg leading-snug">
                {dict.promoB.tagline}
              </p>
              <p className="mt-4 text-cream/60 leading-relaxed text-sm lg:text-base flex-1">
                {dict.promoB.body}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <a
                  href={SITE.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-primary--cream"
                >
                  {dict.promoB.cta}
                </a>
                <span className="text-xl serif text-cream/75">{dict.promoB.price}</span>
              </div>
            </div>
          </div>

          {/* LOYALTY BONUS — Lunasea Luxe voetenbad + massage */}
          <div className="reveal-scroll mt-10 lg:mt-14 border border-gold/20 grid md:grid-cols-[1fr_2fr] gap-6 lg:gap-10 items-center p-6 lg:p-8">
            <div className="relative aspect-[4/3] overflow-hidden bg-cream/5 rounded-lg shadow-[0_18px_45px_-18px_rgba(0,0,0,0.6)]">
              <Image
                src="/images/promo/lunasea-voetenbad.webp"
                alt={dict.loyaltyBonus.title}
                fill
                sizes="(min-width:768px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-terracotta">
                {dict.loyaltyBonus.eyebrow}
              </p>
              <h3 className="mt-3 display text-2xl lg:text-3xl text-cream leading-tight">
                {dict.loyaltyBonus.title}
              </h3>
              <p className="mt-3 text-cream/65 leading-relaxed text-sm lg:text-base">
                {dict.loyaltyBonus.body}
              </p>
            </div>
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
            <div className="flex items-center gap-6 self-start lg:self-auto">
              <RailControls
                targetId="rituals-rail"
                prevLabel={lang === "nl" ? "Vorige behandelingen" : "Previous treatments"}
                nextLabel={lang === "nl" ? "Volgende behandelingen" : "Next treatments"}
              />
              <Link href={`/${lang}/services`} className="link-edit">
                {dict.servicesSection.viewAll}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>

        {/* Rail breaks out of container for full-bleed scroll */}
        <div
          id="rituals-rail"
          className="rail container-px mx-auto w-full max-w-[1400px]"
        >
          {SERVICES.map((s, idx) => {
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
                <div className="arch-frame relative aspect-[3/4] overflow-hidden bg-sand/30">
                  <Image
                    src={s.cardImage}
                    alt={localized(s.name, lang)}
                    fill
                    sizes="(min-width:1024px) 28rem, (min-width:640px) 52vw, 78vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-6 flex items-baseline gap-4">
                  <span
                    className="serif italic text-sm text-gold tabular-nums shrink-0"
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="serif text-2xl lg:text-[1.7rem] text-deep-brown leading-tight group-hover:text-majorelle transition-colors duration-300">
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
            <div className="lg:col-span-6 order-2 lg:order-1 arch-echo">
              <div className="arch-frame relative aspect-[4/5]">
                <Image
                  src={heroAbout}
                  alt={
                    lang === "nl"
                      ? "Interieur van Majorille Garden — sereen Marokkaans-geïnspireerd"
                      : "Interior of Majorille Garden — serene Moroccan-inspired space"
                  }
                  fill
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
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
      <section className="py-32 lg:py-48 bg-deep-brown text-cream riad-trellis-dark dusk-glow">
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

      {/* TESTIMONIAL / REVIEWS */}
      <section className="py-32 lg:py-48 bg-cream">
        <Container size={reviews.length > 0 ? "lg" : "md"}>
          {reviews.length > 0 ? (
            <>
              <div className="text-center mb-14">
                <Eyebrow>{dict.testimonial.eyebrow}</Eyebrow>
                {stats && (
                  <div className="mt-6 inline-flex flex-col items-center gap-3">
                    <StarRating rating={Math.round(stats.avg)} size={22} />
                    <p className="text-sm text-muted">
                      <span className="serif text-2xl text-deep-brown align-middle mr-2">
                        {stats.avg.toFixed(1)}
                      </span>
                      {lang === "nl"
                        ? `gebaseerd op ${stats.count} ${stats.count === 1 ? "review" : "reviews"}`
                        : `based on ${stats.count} ${stats.count === 1 ? "review" : "reviews"}`}
                    </p>
                  </div>
                )}
              </div>
              <ReviewsList reviews={reviews} locale={lang} />
              <div className="mt-12 text-center">
                <Link
                  href={`/${lang}/reviews`}
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-deep-brown hover:text-terracotta"
                >
                  {lang === "nl" ? "Alle reviews" : "All reviews"}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Eyebrow>{dict.testimonial.eyebrow}</Eyebrow>
              <span
                className="block mt-8 serif text-[5rem] leading-[0.5] text-gold select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="mt-6 display text-3xl lg:text-5xl text-deep-brown leading-[1.2] max-w-4xl mx-auto">
                {localized(TESTIMONIAL.quote, lang)}
              </blockquote>
              <p className="mt-12 text-[0.72rem] uppercase tracking-[0.32em] text-terracotta">
                — {TESTIMONIAL.author}
              </p>
              <div className="mt-12">
                <Link
                  href={`/${lang}/reviews`}
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-deep-brown hover:text-terracotta"
                >
                  {lang === "nl" ? "Laat een review achter" : "Leave a review"}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
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
          <FAQAccordion faqs={faqs} locale={lang} />
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
              {vacation && (
                <p className="mt-6 max-w-md px-4 py-3 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta-dark leading-relaxed">
                  {dict.vacation.contactNotice}
                </p>
              )}
              <div className="mt-16">
                <NewsletterForm dict={dict.newsletter} />
              </div>
            </div>
            <div>
              <ContactForm dict={contactDict} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

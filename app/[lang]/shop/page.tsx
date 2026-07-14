import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { PRODUCTS, localized, formatPriceEUR } from "@/lib/content";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getDictionary, hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";
import { getPromo } from "@/lib/promos";
import { isVacationActive } from "@/lib/vacation";
import { ProductsJsonLd } from "@/components/JsonLd";

export async function generateMetadata(props: PageProps<"/[lang]/shop">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/shop",
    title:
      lang === "nl" ? "Shop · Majorille Garden" : "Shop · Majorille Garden",
    description:
      lang === "nl"
        ? "Biologische producten van Majorille Garden: arganolie, jojoba-olie en nila poeder, recht uit Marokko."
        : "Organic products from Majorille Garden: argan oil, jojoba oil, and nila powder, sourced directly from Morocco.",
  });
}

export default async function ShopPage(props: PageProps<"/[lang]/shop">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const sp = await props.searchParams;
  // Carry a valid promo through to each Buy Now link so the discount survives
  // the listing → checkout hop without the visitor having to remember it.
  const promoRaw = typeof sp.promo === "string" ? sp.promo : null;
  const promoBanner = await getPromo(promoRaw);
  const promoQS =
    promoBanner && promoBanner.applies === "product"
      ? `?promo=${promoBanner.code}`
      : "";

  return (
    <section className="py-24 lg:py-36">
      <ProductsJsonLd products={PRODUCTS} locale={lang} />
      <Container>
        <div className="max-w-3xl mb-16 lg:mb-24">
          <div className="reveal"><Eyebrow>{dict.products.eyebrow}</Eyebrow></div>
          <h1 className="reveal reveal-2 display mt-6 text-4xl sm:text-5xl lg:text-7xl text-deep-brown">
            {dict.shop.title}
          </h1>
          <p className="reveal reveal-3 mt-8 text-lg lg:text-xl text-muted leading-relaxed">
            {dict.shop.subtitle}
          </p>
          {isVacationActive() && (
            <div className="reveal reveal-3 mt-6">
              <p className="inline-block px-4 py-2 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta-dark">
                {dict.vacation.shopNotice}
              </p>
            </div>
          )}
          {promoBanner && (
            <p className="mt-6 inline-block px-4 py-2 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta-dark">
              {lang === "nl" ? "Kortingscode" : "Promo code"}{" "}
              <code className="font-mono tracking-[0.18em] ml-1">
                {promoBanner.code}
              </code>{" "}
              {lang === "nl"
                ? "is actief — wordt automatisch toegepast bij het afrekenen."
                : "is active — applied automatically at checkout."}
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {PRODUCTS.map((p) => (
            <div key={p.slug} className="group">
              <div className="relative aspect-square bg-sand/30 overflow-hidden">
                <Image
                  src={p.image}
                  alt={localized(p.name, lang)}
                  fill
                  sizes="(min-width:1024px) 30vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {p.compareAtCents && (
                  <span className="absolute top-3 left-3 bg-terracotta text-cream text-xs uppercase tracking-[0.18em] px-3 py-1">
                    {dict.products.sale}
                  </span>
                )}
              </div>
              <h3 className="mt-5 serif text-2xl text-deep-brown">
                {localized(p.name, lang)}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {localized(p.shortDescription, lang)}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="serif text-2xl text-deep-brown">
                  {formatPriceEUR(p.priceCents, lang)}
                </span>
                {p.compareAtCents && (
                  <span className="text-sm text-muted line-through">
                    {formatPriceEUR(p.compareAtCents, lang)}
                  </span>
                )}
              </div>
              {p.inStock === false ? (
                <span className="mt-6 inline-block px-3 py-1 bg-sand/50 text-muted text-xs uppercase tracking-[0.18em]">
                  {lang === "nl" ? "Uitverkocht" : "Out of stock"}
                </span>
              ) : (
                <Link
                  href={`/${lang}/shop/${p.slug}/checkout${promoQS}`}
                  className="link-edit mt-6"
                >
                  {dict.shop.buyNow}
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

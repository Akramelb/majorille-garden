import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { PRODUCTS } from "@/lib/content";
import { ShopCheckoutForm } from "@/components/sections/ShopCheckoutForm";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { buildMetadata } from "@/lib/seo";
import { getPromo } from "@/lib/promos";
import { isVacationActive } from "@/lib/vacation";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[lang]/shop/[slug]/checkout">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return {};
  return buildMetadata({
    locale: lang,
    path: `/shop/${slug}/checkout`,
    title:
      lang === "nl"
        ? `Afrekenen — ${product.name.nl} · Majorille Garden`
        : `Checkout — ${product.name.en} · Majorille Garden`,
    description:
      lang === "nl"
        ? "Veilig afrekenen via Mollie."
        : "Secure checkout via Mollie.",
    index: false,
  });
}

export default async function ShopCheckout(
  props: PageProps<"/[lang]/shop/[slug]/checkout">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();
  const dict = await getDictionary(lang);
  const sp = await props.searchParams;
  // Resolve any incoming `?promo=...` to its canonical code (uppercase, valid).
  // Bogus codes silently drop to null so the form doesn't display a
  // "discount applied" line that won't actually apply server-side.
  const promo = await getPromo(typeof sp.promo === "string" ? sp.promo : null);
  const promoCode = promo && promo.applies === "product" ? promo.code : null;
  const promoPercent = promo && promo.applies === "product" ? promo.discountPercent : null;

  return (
    <section className="py-24 lg:py-36">
      <Container size="xl">
        <div className="max-w-3xl mb-12 lg:mb-16">
          <Eyebrow>{dict.nav.shop}</Eyebrow>
          <h1 className="display mt-6 text-4xl sm:text-5xl lg:text-6xl text-deep-brown">
            {dict.shop.checkout.title}
          </h1>
          {isVacationActive() && (
            <p className="mt-6 inline-block px-4 py-2 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta-dark">
              {dict.vacation.shopNotice}
            </p>
          )}
        </div>
        <ShopCheckoutForm
          product={product}
          lang={lang}
          dict={dict.shop.checkout}
          initialPromoCode={promoCode}
          initialPromoPercent={promoPercent}
        />
      </Container>
    </section>
  );
}

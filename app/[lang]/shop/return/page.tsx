import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";
import { UpsellBanner } from "@/components/sections/UpsellBanner";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { getOrderById } from "@/lib/orders";
import { verifyOrderToken } from "@/lib/order-token";
import { formatPriceEUR } from "@/lib/content";
import { getPromo } from "@/lib/promos";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ShopReturn(
  props: PageProps<"/[lang]/shop/return">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const sp = await props.searchParams;
  const orderId = typeof sp.orderId === "string" ? sp.orderId : "";
  const token = typeof sp.t === "string" ? sp.t : null;
  if (!orderId) notFound();
  if (!verifyOrderToken(orderId, token)) notFound();

  const order = await getOrderById(orderId);
  if (!order || order.kind !== "product") notFound();

  const dict = await getDictionary(lang);

  const reference = `#${order.id.slice(0, 8)}`;
  const lineItems = order.line_items ?? [];
  const addr = order.shipping_address as
    | {
        line1?: string;
        line2?: string | null;
        postal_code?: string;
        city?: string;
        country?: string;
      }
    | null;

  // Terminal states — no auto-refresh.
  if (order.status === "paid") {
    // Resolve booking cross-sell. If admin disabled BOEK10, no banner shows.
    const upsell = await getPromo("BOEK10");
    return (
      <section className="py-24 lg:py-36">
        <Container size="md">
          <Eyebrow>{dict.nav.shop}</Eyebrow>
          <h1 className="display mt-6 text-4xl sm:text-5xl text-deep-brown">
            {dict.shop.orderConfirmed}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {lang === "nl" ? "Bestelling" : "Order"} {reference}
          </p>

          <div className="mt-12 border-t border-border/60 pt-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted mb-4">
              {dict.shop.checkout.summary}
            </p>
            <ul className="divide-y divide-border/60">
              {lineItems.map((li, i) => {
                const name = lang === "nl" ? li.name_nl : li.name_en;
                return (
                  <li
                    key={`${li.slug}-${i}`}
                    className="flex justify-between py-3 text-deep-brown"
                  >
                    <span>
                      {li.qty} × {name}
                    </span>
                    <span>{formatPriceEUR(li.unit_cents * li.qty, lang)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-between serif text-lg text-deep-brown border-t border-border/60 pt-4">
              <span>{lang === "nl" ? "Totaal" : "Total"}</span>
              <span>{formatPriceEUR(order.amount_cents, lang)}</span>
            </div>
          </div>

          {addr && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.18em] text-muted mb-3">
                {dict.shop.checkout.shippingTitle}
              </p>
              <address className="not-italic text-sm text-deep-brown leading-relaxed">
                {order.customer_name && (
                  <>
                    {order.customer_name}
                    <br />
                  </>
                )}
                {addr.line1}
                {addr.line2 ? (
                  <>
                    <br />
                    {addr.line2}
                  </>
                ) : null}
                <br />
                {addr.postal_code} {addr.city}
                <br />
                {addr.country}
              </address>
            </div>
          )}

          {/* Cross-sell: just bought a product → discount on a treatment.
              Admin can disable BOEK10 in /admin/promos; banner just hides. */}
          {upsell && upsell.applies === "booking" && (
            <UpsellBanner
              code={upsell.code}
              label={lang === "nl" ? upsell.labelNl : upsell.labelEn}
              ctaHref={`/${lang}/booking`}
              ctaLabel={lang === "nl" ? "Boek een behandeling" : "Book a treatment"}
              lang={lang}
            />
          )}

          <div className="mt-12">
            <Link href={`/${lang}/shop`} className="btn-secondary">
              {lang === "nl" ? "Terug naar de shop" : "Back to the shop"}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  if (
    order.status === "open" ||
    order.status === "pending" ||
    order.status === "authorized"
  ) {
    return (
      <section className="py-24 lg:py-36">
        {/* Auto-refresh while the Mollie webhook flips the order to paid/failed. */}
        <meta httpEquiv="refresh" content="4" />
        <Container size="md">
          <Eyebrow>{dict.nav.shop}</Eyebrow>
          <h1 className="display mt-6 text-4xl sm:text-5xl text-deep-brown">
            {dict.shop.orderProcessing}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {lang === "nl" ? "Bestelling" : "Order"} {reference}
          </p>
          <p className="mt-8 text-muted">
            {lang === "nl"
              ? "Deze pagina ververst automatisch."
              : "This page refreshes automatically."}
          </p>
        </Container>
      </section>
    );
  }

  // Failure / cancelled / expired / refunded — offer a retry path.
  return (
    <section className="py-24 lg:py-36">
      <Container size="md">
        <Eyebrow>{dict.nav.shop}</Eyebrow>
        <h1 className="display mt-6 text-4xl sm:text-5xl text-deep-brown">
          {dict.shop.orderFailed}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {lang === "nl" ? "Bestelling" : "Order"} {reference}
        </p>
        <div className="mt-12">
          <Link href={`/${lang}/shop`} className="btn-primary">
            {lang === "nl" ? "Opnieuw proberen" : "Try again"}
          </Link>
        </div>
      </Container>
    </section>
  );
}

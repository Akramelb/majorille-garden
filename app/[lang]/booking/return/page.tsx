import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { BookingEmbed } from "@/components/sections/BookingEmbed";
import { UpsellBanner } from "@/components/sections/UpsellBanner";
import { SERVICES, SITE, localized } from "@/lib/content";
import { getOrderById } from "@/lib/orders";
import { verifyOrderToken } from "@/lib/order-token";
import { getPromo } from "@/lib/promos";
import { getDictionary, hasLocale } from "../../dictionaries";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function BookingReturn(
  props: PageProps<"/[lang]/booking/return">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const sp = await props.searchParams;
  const orderId = typeof sp.orderId === "string" ? sp.orderId : "";
  const token = typeof sp.t === "string" ? sp.t : null;
  if (!orderId) notFound();
  if (!verifyOrderToken(orderId, token)) notFound();

  const order = await getOrderById(orderId);
  if (!order || order.kind !== "booking") notFound();

  const service = order.service_slug
    ? SERVICES.find((s) => s.slug === order.service_slug) ?? null
    : null;

  const heading = service
    ? localized(service.name, lang)
    : dict.booking.title;

  const retryHref = order.service_slug
    ? `/${lang}/booking?service=${order.service_slug}`
    : `/${lang}/booking`;

  // --- Paid: render the Cal.com embed prefilled with the buyer details.
  if (order.status === "paid") {
    const calLink = `${SITE.calUsername}/${order.booking_slug ?? ""}`;
    // Resolve the cross-sell promo for shop. If the admin disabled or deleted
    // the BEDANKT10 code, the banner just doesn't render — no broken state.
    const upsell = await getPromo("BEDANKT10");
    return (
      <section className="py-24 lg:py-36">
        <Container size="xl">
          <div className="max-w-3xl mb-12 lg:mb-16">
            <Eyebrow>{dict.nav.booking}</Eyebrow>
            <h1 className="display mt-6 text-4xl sm:text-5xl lg:text-6xl text-deep-brown">
              {heading}
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              {dict.booking.afterPayment}
            </p>
          </div>
          <BookingEmbed
            calLink={calLink}
            prefillEmail={order.customer_email ?? null}
            prefillName={order.customer_name}
            lang={lang}
          />
          {/* Cross-sell: just booked → off the shop. The banner is below the
              Cal.com picker so it never distracts from the primary action
              (book the actual slot) but rewards anyone who scrolls. The
              admin can disable/delete BEDANKT10 in `/admin/promos`; when
              that happens, `getPromo` returns null and we don't render. */}
          {upsell && upsell.applies === "product" && (
            <UpsellBanner
              code={upsell.code}
              label={lang === "nl" ? upsell.labelNl : upsell.labelEn}
              ctaHref={`/${lang}/shop`}
              ctaLabel={lang === "nl" ? "Bekijk de producten" : "Browse products"}
              lang={lang}
            />
          )}
        </Container>
      </section>
    );
  }

  // --- Pending: auto-refresh every 4s while the webhook flips the status.
  if (
    order.status === "open" ||
    order.status === "pending" ||
    order.status === "authorized"
  ) {
    return (
      <section className="py-24 lg:py-36">
        {/* Server-rendered meta refresh — simplest reliable poll while the
            Mollie webhook flips the order to `paid`. No client JS needed. */}
        <meta httpEquiv="refresh" content="4" />
        <Container size="sm">
          <Eyebrow>{dict.nav.booking}</Eyebrow>
          <h1 className="display mt-6 text-3xl sm:text-4xl lg:text-5xl text-deep-brown">
            {dict.booking.confirming}
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            {lang === "nl"
              ? "Even geduld — we wachten op bevestiging van Mollie."
              : "Hold on — we're waiting for confirmation from Mollie."}
          </p>
        </Container>
      </section>
    );
  }

  // --- Failure branch: failed / canceled / expired / refunded → retry link.
  return (
    <section className="py-24 lg:py-36">
      <Container size="sm">
        <Eyebrow>{dict.nav.booking}</Eyebrow>
        <h1 className="display mt-6 text-3xl sm:text-4xl lg:text-5xl text-deep-brown">
          {dict.booking.paymentFailed}
        </h1>
        <p className="mt-6 text-lg text-muted leading-relaxed">
          {lang === "nl"
            ? "Geen zorgen — er is niets afgeschreven. Probeer het opnieuw of neem contact met ons op."
            : "Don't worry — nothing has been charged. Try again or get in touch."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={retryHref} className="btn-primary">
            {dict.booking.retry}
          </Link>
          <a href={`mailto:${SITE.email}`} className="btn-secondary">
            {SITE.email}
          </a>
        </div>
      </Container>
    </section>
  );
}

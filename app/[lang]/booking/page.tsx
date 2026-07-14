import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { BookingForm } from "@/components/sections/BookingForm";
import { getDictionary, hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";
import { getPromo } from "@/lib/promos";
import { isVacationActive } from "@/lib/vacation";

export async function generateMetadata(props: PageProps<"/[lang]/booking">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/booking",
    title:
      lang === "nl"
        ? "Reserveren · Majorille Garden"
        : "Booking · Majorille Garden",
    description:
      lang === "nl"
        ? "Reserveer een behandeling bij Majorille Garden in Amsterdam. Kies een treatment en plan direct een geschikt moment."
        : "Reserve a treatment at Majorille Garden in Amsterdam. Choose a treatment and book a time directly.",
  });
}

export default async function BookingPage(
  props: PageProps<"/[lang]/booking">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const searchParams = await props.searchParams;
  const initialSlug = typeof searchParams.service === "string"
    ? searchParams.service
    : undefined;
  // Resolve any `?promo=...` query param. Bogus codes silently drop so the
  // discount-active line below doesn't show for invalid input.
  const promo = await getPromo(
    typeof searchParams.promo === "string" ? searchParams.promo : null,
  );
  const initialPromoCode =
    promo && promo.applies === "booking" ? promo.code : null;
  const initialPromoPercent =
    promo && promo.applies === "booking" ? promo.discountPercent : null;

  return (
    <section className="py-24 lg:py-36">
      <Container size="xl">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <div className="reveal"><Eyebrow>{dict.nav.booking}</Eyebrow></div>
          <h1 className="reveal reveal-2 display mt-6 text-4xl sm:text-5xl lg:text-7xl text-deep-brown">
            {dict.booking.title}
          </h1>
          <p className="reveal reveal-3 mt-8 text-lg lg:text-xl text-muted leading-relaxed">
            {dict.booking.subtitle}
          </p>
          {isVacationActive() && (
            <div className="reveal reveal-3 mt-8 border border-terracotta/40 bg-terracotta/10 p-5 sm:p-6">
              <p className="text-sm font-medium text-deep-brown mb-1">
                {dict.vacation.bookingTitle}
              </p>
              <p className="text-sm text-muted leading-relaxed">
                {dict.vacation.bookingBody}
              </p>
            </div>
          )}
        </div>
        <BookingForm
          dict={dict.booking}
          locale={lang}
          initialSlug={initialSlug}
          initialPromoCode={initialPromoCode}
          initialPromoPercent={initialPromoPercent}
        />
      </Container>
    </section>
  );
}

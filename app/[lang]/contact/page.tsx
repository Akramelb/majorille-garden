import Image from "next/image";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { ContactForm } from "@/components/sections/ContactForm";
import { SITE, localized } from "@/lib/content";
import { getDictionary, hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";
import { isVacationActive } from "@/lib/vacation";

export async function generateMetadata(props: PageProps<"/[lang]/contact">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/contact",
    title:
      lang === "nl" ? "Contact · Majorille Garden" : "Contact · Majorille Garden",
    description:
      lang === "nl"
        ? "Neem contact op met Majorille Garden in Amsterdam — vragen, afspraken of meer informatie over onze behandelingen."
        : "Get in touch with Majorille Garden in Amsterdam — questions, appointments, or more information about our treatments.",
  });
}

export default async function ContactPage(
  props: PageProps<"/[lang]/contact">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const vacation = isVacationActive();
  // During the vacation window the form's success copy shouldn't promise a
  // reply within 24 hours — swap in the slower-reply variant.
  const contactDict = vacation
    ? { ...dict.contactSection, success: dict.vacation.contactSuccess }
    : dict.contactSection;

  return (
    <section className="py-24 lg:py-36">
      <Container size="xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <div className="reveal"><Eyebrow>{dict.contactSection.eyebrow}</Eyebrow></div>
            <h1 className="reveal reveal-2 display mt-6 text-4xl sm:text-5xl lg:text-7xl text-deep-brown">
              {dict.contactSection.title}
            </h1>
            <p className="reveal reveal-3 mt-8 text-lg lg:text-xl text-muted leading-relaxed max-w-md">
              {dict.contactSection.subtitle}
            </p>
            {vacation && (
              <p className="reveal reveal-3 mt-6 max-w-md px-4 py-3 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta-dark leading-relaxed">
                {dict.vacation.contactNotice}
              </p>
            )}

            <div className="mt-12 space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 flex items-center justify-center bg-terracotta/15 text-terracotta shrink-0">
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted mb-1">
                    {dict.footer.address}
                  </p>
                  <p className="text-deep-brown">
                    {SITE.address.street}, {SITE.address.postalCity},{" "}
                    {localized(SITE.address.country, lang)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 flex items-center justify-center bg-terracotta/15 text-terracotta shrink-0">
                  <Phone size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted mb-1">
                    {lang === "nl" ? "Telefoon" : "Phone"}
                  </p>
                  <a
                    href={SITE.phoneLink}
                    className="text-deep-brown hover:text-terracotta"
                  >
                    {SITE.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 flex items-center justify-center bg-terracotta/15 text-terracotta shrink-0">
                  <Mail size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted mb-1">
                    {lang === "nl" ? "E-mail" : "Email"}
                  </p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="text-deep-brown hover:text-terracotta"
                  >
                    {SITE.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 flex items-center justify-center bg-terracotta/15 text-terracotta shrink-0">
                  <Clock size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted mb-1">
                    {dict.footer.hours}
                  </p>
                  <p className="text-deep-brown">
                    {localized(SITE.hours.women.label, lang)} ·{" "}
                    {localized(SITE.hours.women.range, lang)}
                  </p>
                  <p className="text-deep-brown">
                    {localized(SITE.hours.men.label, lang)} ·{" "}
                    {localized(SITE.hours.men.range, lang)}
                  </p>
                </div>
              </div>
            </div>

            <div className="arch-frame relative mt-12 aspect-[5/4] hidden lg:block">
              <Image
                src="/images/contact/location.jpg"
                alt={
                  lang === "nl"
                    ? "Locatie van Majorille Garden in Amsterdam"
                    : "Location of Majorille Garden in Amsterdam"
                }
                fill
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="bg-cream lg:p-10 lg:border lg:border-border/40">
            <ContactForm dict={contactDict} />
          </div>
        </div>
      </Container>
    </section>
  );
}

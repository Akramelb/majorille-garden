import { notFound } from "next/navigation";
import { localized, servicesByDepartment } from "@/lib/content";
import { Container, Eyebrow } from "@/components/ui/Container";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { getDictionary, hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(
  props: PageProps<"/[lang]/services">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/services",
    title: lang === "nl" ? "Behandelingen" : "Treatments",
    description:
      lang === "nl"
        ? "Onze behandelingen: warme zandbad, bio head spa, traditionele massage, hete steen, kruidenstempel, lichaamsscrub, dry cupping en voedingsadvies."
        : "Our treatments: warm sand bath, bio head spa, traditional massage, hot stone, herbal stamp, body scrub, dry cupping, and nutritional advice.",
  });
}

export default async function ServicesIndex(
  props: PageProps<"/[lang]/services">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <section className="py-24 lg:py-36">
      <Container>
        <div className="max-w-3xl mb-16 lg:mb-24">
          <div className="reveal"><Eyebrow>{dict.servicesSection.eyebrow}</Eyebrow></div>
          <h1 className="reveal reveal-2 display mt-6 text-4xl sm:text-5xl lg:text-7xl text-deep-brown">
            {dict.servicesSection.title}
          </h1>
          <p className="reveal reveal-3 mt-8 text-lg lg:text-xl text-muted leading-relaxed">
            {dict.servicesSection.subtitle}
          </p>
        </div>
        <div className="space-y-24 lg:space-y-32">
          {servicesByDepartment().map((d) => (
            <div key={d.id} id={d.anchor} className="scroll-mt-32">
              <div className="mb-10 lg:mb-14 border-t border-border pt-8">
                <h2 className="serif text-3xl lg:text-4xl text-deep-brown">
                  {localized(d.name, lang)}
                </h2>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">
                  {localized(d.tagline, lang)}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
                {d.services.map((s) => (
                  <ServiceCard
                    key={s.slug}
                    service={s}
                    locale={lang}
                    fromLabel={dict.servicesSection.from}
                    minutesLabel={dict.servicesSection.minutes}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

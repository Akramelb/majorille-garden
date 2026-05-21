import Image from "next/image";
import { notFound } from "next/navigation";
import { ABOUT, localized } from "@/lib/content";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getDictionary, hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/[lang]/about">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/about",
    title:
      lang === "nl"
        ? "Over Majorille Garden · Marokkaanse traditie, biologisch en eerlijk"
        : "About Majorille Garden · Moroccan tradition, organic and fair",
    description:
      lang === "nl"
        ? "Ontdek het verhaal achter Majorille Garden — Marokkaanse rituelen, biologische producten en eerlijke samenwerkingen met Berbervrouwen uit Souss-Massa."
        : "The story behind Majorille Garden — Moroccan rituals, organic products, and fair partnerships with Berber women from Souss-Massa.",
  });
}

export default async function AboutPage(props: PageProps<"/[lang]/about">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <section className="pt-20 lg:pt-28 pb-16 lg:pb-28">
        <Container>
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <Eyebrow>{dict.about.eyebrow}</Eyebrow>
              <h1 className="display mt-6 text-5xl lg:text-7xl text-deep-brown">
                {dict.about.title}
              </h1>
              {localized(ABOUT.hero, lang).map((p, i) => (
                <p
                  key={i}
                  className="mt-6 text-lg text-muted leading-[1.75] max-w-xl"
                >
                  {p}
                </p>
              ))}
            </div>
            <div className="relative aspect-[4/5]">
              <Image
                src="/images/about/hero.png"
                alt="Majorille Garden — atmosphere"
                fill
                priority
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {ABOUT.sections.map((section, i) => (
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
              <div className="relative aspect-[5/4]">
                <Image
                  src={section.image}
                  alt={localized(section.title, lang)}
                  fill
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
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
    </>
  );
}

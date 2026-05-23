import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TERMS } from "@/lib/legal";
import { hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/[lang]/terms">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const doc = TERMS[lang];
  return buildMetadata({
    locale: lang,
    path: "/terms",
    title: `${doc.title} · Majorille Garden`,
    description: doc.title,
  });
}

export default async function TermsPage(props: PageProps<"/[lang]/terms">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const doc = TERMS[lang];
  return (
    <section className="py-20 lg:py-28">
      <Container size="md">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
          {doc.updated}
        </p>
        <h1 className="mt-4 serif text-4xl sm:text-5xl lg:text-6xl text-deep-brown leading-[1.05]">
          {doc.title}
        </h1>
        <div className="mt-10 space-y-10">
          {doc.sections.map((section, i) => (
            <div key={i}>
              <h2 className="serif text-2xl lg:text-3xl text-deep-brown">
                {section.heading}
              </h2>
              {section.body.map((p, j) => (
                <p
                  key={j}
                  className="mt-4 text-muted leading-relaxed max-w-2xl"
                >
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

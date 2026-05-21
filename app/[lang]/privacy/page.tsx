import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PRIVACY } from "@/lib/legal";
import { hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/[lang]/privacy">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const doc = PRIVACY[lang];
  return buildMetadata({
    locale: lang,
    path: "/privacy",
    title: `${doc.title} · Majorille Garden`,
    description: doc.title,
  });
}

export default async function PrivacyPage(props: PageProps<"/[lang]/privacy">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const doc = PRIVACY[lang];
  return (
    <section className="py-20 lg:py-28">
      <Container size="md">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
          {doc.updated}
        </p>
        <h1 className="mt-4 serif text-5xl lg:text-6xl text-deep-brown leading-[1.05]">
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

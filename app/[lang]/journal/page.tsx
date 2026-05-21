import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getPublishedPosts, postTitle, postExcerpt } from "@/lib/blog";
import { hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const COPY = {
  nl: {
    eyebrow: "Journal",
    title: "Rituelen, kruiden & verhalen",
    intro:
      "Verhalen over Marokkaanse wellness-tradities, biologische ingrediënten en het ritme van rust — uit de tuin van Majorille.",
    empty: "Binnenkort verschijnen hier de eerste verhalen.",
    read: "Lees verder",
  },
  en: {
    eyebrow: "Journal",
    title: "Rituals, herbs & stories",
    intro:
      "Stories on Moroccan wellness traditions, organic ingredients, and the rhythm of rest — from the Majorille garden.",
    empty: "The first stories will appear here soon.",
    read: "Read more",
  },
} as const;

export async function generateMetadata(props: PageProps<"/[lang]/journal">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/journal",
    title: lang === "nl" ? "Journal · Majorille Garden" : "Journal · Majorille Garden",
    description: COPY[lang].intro,
  });
}

export default async function JournalPage(props: PageProps<"/[lang]/journal">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const t = COPY[lang];
  const posts = await getPublishedPosts();

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="max-w-2xl mb-14">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-4 serif text-5xl lg:text-7xl text-deep-brown leading-[1.05]">
            {t.title}
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">{t.intro}</p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/${lang}/journal/${p.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-sand/30 overflow-hidden">
                  {p.cover_image && (
                    <Image
                      src={p.cover_image}
                      alt={postTitle(p, lang)}
                      fill
                      sizes="(min-width:1024px) 30vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <h2 className="mt-5 serif text-2xl text-deep-brown leading-tight">
                  {postTitle(p, lang)}
                </h2>
                <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                  {postExcerpt(p, lang)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-terracotta">
                  {t.read} <ArrowUpRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

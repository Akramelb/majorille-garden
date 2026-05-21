import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Markdown } from "@/components/Markdown";
import {
  getPostBySlug,
  postTitle,
  postExcerpt,
  postBody,
} from "@/lib/blog";
import { hasLocale } from "../../dictionaries";
import { buildMetadata, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[lang]/journal/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};
  const post = await getPostBySlug(slug);
  if (!post || !post.published) return {};
  return buildMetadata({
    locale: lang,
    path: `/journal/${slug}`,
    title: `${postTitle(post, lang)} · Majorille Garden`,
    description: postExcerpt(post, lang) || postTitle(post, lang),
    image: post.cover_image ?? undefined,
  });
}

export default async function JournalPost(
  props: PageProps<"/[lang]/journal/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const title = postTitle(post, lang);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: postExcerpt(post, lang),
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "Majorille Garden" },
    publisher: { "@type": "Organization", name: "Majorille Garden" },
    mainEntityOfPage: `${siteUrl()}/${lang}/journal/${slug}`,
  };

  return (
    <article className="py-16 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <Container size="md">
        <Link
          href={`/${lang}/journal`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted hover:text-deep-brown mb-8"
        >
          ← {lang === "nl" ? "Journal" : "Journal"}
        </Link>
        <h1 className="serif text-4xl lg:text-6xl text-deep-brown leading-[1.08]">
          {title}
        </h1>
        {postExcerpt(post, lang) && (
          <p className="mt-5 text-xl text-muted leading-relaxed">
            {postExcerpt(post, lang)}
          </p>
        )}
      </Container>

      {post.cover_image && (
        <Container size="lg" className="mt-10">
          <div className="relative aspect-[16/9] bg-sand/30 overflow-hidden">
            <Image
              src={post.cover_image}
              alt={title}
              fill
              priority
              sizes="(min-width:1024px) 70vw, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      )}

      <Container size="md" className="mt-12">
        <Markdown>{postBody(post, lang)}</Markdown>
      </Container>
    </article>
  );
}

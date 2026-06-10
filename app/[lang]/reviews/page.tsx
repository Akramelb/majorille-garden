import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { ReviewsList } from "@/components/sections/ReviewsList";
import { ReviewForm } from "@/components/sections/ReviewForm";
import { StarRating } from "@/components/sections/StarRating";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews";
import { hasLocale } from "../dictionaries";
import { buildMetadata } from "@/lib/seo";
import { AggregateRatingJsonLd } from "@/components/JsonLd";

// ISR: re-render at most every 5 min instead of on every request — admin
// publishes/moderation appear within that window without a redeploy.
export const revalidate = 300;

const COPY = {
  nl: {
    eyebrow: "Reviews",
    title: "Wat onze gasten zeggen",
    intro:
      "Echte ervaringen van gasten bij Majorille Garden. Heeft u een behandeling gehad? Wij horen het graag.",
    based: "gebaseerd op",
    reviews: "reviews",
    empty: "Er zijn nog geen reviews geplaatst. Wees de eerste.",
  },
  en: {
    eyebrow: "Reviews",
    title: "What our guests say",
    intro:
      "Real experiences from guests at Majorille Garden. Had a treatment? We'd love to hear about it.",
    based: "based on",
    reviews: "reviews",
    empty: "No reviews yet. Be the first.",
  },
} as const;

export async function generateMetadata(props: PageProps<"/[lang]/reviews">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return buildMetadata({
    locale: lang,
    path: "/reviews",
    title: lang === "nl" ? "Reviews · Majorille Garden" : "Reviews · Majorille Garden",
    description: COPY[lang].intro,
  });
}

export default async function ReviewsPage(props: PageProps<"/[lang]/reviews">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const t = COPY[lang];
  const [reviews, stats] = await Promise.all([
    getApprovedReviews(60),
    getReviewStats(),
  ]);

  return (
    <section className="py-20 lg:py-28">
      {stats && <AggregateRatingJsonLd avg={stats.avg} count={stats.count} />}
      <Container>
        <div className="max-w-2xl mb-12">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-4 serif text-4xl sm:text-5xl lg:text-7xl text-deep-brown leading-[1.05]">
            {t.title}
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">{t.intro}</p>
          {stats && (
            <div className="mt-6 flex items-center gap-3">
              <StarRating rating={Math.round(stats.avg)} size={18} />
              <span className="text-deep-brown font-medium">
                {stats.avg.toFixed(1)}
              </span>
              <span className="text-muted text-sm">
                {t.based} {stats.count} {t.reviews}
              </span>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <ReviewsList reviews={reviews} locale={lang} />
        ) : (
          <p className="text-muted">{t.empty}</p>
        )}

        <div className="mt-20 max-w-2xl border-t border-border/60 pt-12">
          <ReviewForm locale={lang} />
        </div>
      </Container>
    </section>
  );
}

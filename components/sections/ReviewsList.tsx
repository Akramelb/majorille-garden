import type { Review } from "@/lib/reviews";
import { getServiceBySlug, localized } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";
import { StarRating } from "./StarRating";

export function ReviewsList({
  reviews,
  locale,
}: {
  reviews: Review[];
  locale: Locale;
}) {
  if (reviews.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((r) => {
        const svc = r.service_slug ? getServiceBySlug(r.service_slug) : null;
        return (
          <figure
            key={r.id}
            className="bg-cream border border-border/50 p-6 flex flex-col"
          >
            <StarRating rating={r.rating} />
            <blockquote className="mt-4 text-deep-brown leading-relaxed flex-1">
              &ldquo;{r.body}&rdquo;
            </blockquote>
            <figcaption className="mt-5 pt-4 border-t border-border/40">
              <span className="text-sm text-deep-brown font-medium">
                {r.author_name}
              </span>
              {svc && (
                <span className="block text-xs uppercase tracking-[0.16em] text-terracotta mt-1">
                  {localized(svc.name, locale)}
                </span>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

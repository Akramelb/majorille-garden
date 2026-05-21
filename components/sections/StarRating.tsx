import { Star } from "lucide-react";
import { clsx } from "clsx";

export function StarRating({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex gap-0.5", className)}
      aria-label={`${rating} / 5`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rating
              ? "fill-terracotta text-terracotta"
              : "fill-transparent text-border"
          }
        />
      ))}
    </span>
  );
}

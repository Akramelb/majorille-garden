"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { clsx } from "clsx";
import { submitReview, type FormState } from "@/lib/actions";
import { SERVICES, localized } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";

const COPY: Record<Locale, Record<string, string>> = {
  nl: {
    title: "Deel uw ervaring",
    subtitle: "Laat een review achter — na goedkeuring verschijnt deze op de site.",
    name: "Naam",
    rating: "Beoordeling",
    treatment: "Behandeling (optioneel)",
    none: "Algemeen",
    review: "Uw review",
    submit: "Versturen",
    sending: "Versturen…",
    success: "Bedankt! Uw review wordt beoordeeld en verschijnt na goedkeuring.",
    error: "Er ging iets mis. Probeer het opnieuw.",
  },
  en: {
    title: "Share your experience",
    subtitle: "Leave a review — it appears on the site once approved.",
    name: "Name",
    rating: "Rating",
    treatment: "Treatment (optional)",
    none: "General",
    review: "Your review",
    submit: "Submit",
    sending: "Sending…",
    success: "Thank you! Your review is pending approval and will appear soon.",
    error: "Something went wrong. Please try again.",
  },
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? busy : idle}
    </button>
  );
}

export function ReviewForm({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, formAction] = useActionState<FormState, FormData>(
    submitReview,
    null,
  );

  if (state?.ok) {
    return (
      <div className="bg-olive/10 border-l-2 border-olive p-6">
        <p className="text-deep-brown">{t.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] w-px h-px"
      />
      <h3 className="serif text-2xl text-deep-brown">{t.title}</h3>
      <p className="text-sm text-muted -mt-3">{t.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            {t.name} *
          </span>
          <input
            name="author_name"
            required
            className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            {t.treatment}
          </span>
          <select
            name="service_slug"
            defaultValue=""
            className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown"
          >
            <option value="">{t.none}</option>
            {SERVICES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {localized(s.name, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          {t.rating} *
        </span>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            const active = (hover || rating) >= val;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHover(val)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${val} / 5`}
                className="p-1"
              >
                <Star
                  size={26}
                  className={clsx(
                    active
                      ? "fill-terracotta text-terracotta"
                      : "fill-transparent text-border",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          {t.review} *
        </span>
        <textarea
          name="body"
          required
          rows={4}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown resize-none"
        />
      </label>

      <div className="flex items-center gap-4">
        <SubmitButton idle={t.submit} busy={t.sending} />
        {state && !state.ok && (
          <p className="text-terracotta text-sm">{t.error}</p>
        )}
      </div>
    </form>
  );
}

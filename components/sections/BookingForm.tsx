"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import {
  SERVICES,
  SITE,
  calLinkForService,
  formatPriceEUR,
  localized,
  type Audience,
  type Service,
} from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";

type Dict = {
  title: string;
  subtitle: string;
  audience: string;
  step1: string;
  step2: string;
  noService: string;
  byAppointment: string;
  hoursTitle: string;
  hoursWomen: string;
  hoursMen: string;
};

export function BookingForm({
  dict,
  locale,
  initialSlug,
}: {
  dict: Dict;
  locale: Locale;
  initialSlug?: string;
}) {
  const initial = SERVICES.find((s) => s.slug === initialSlug) ?? null;
  const [audience, setAudience] = useState<Audience | null>(null);
  const [service, setService] = useState<Service | null>(initial);
  const [variantIdx, setVariantIdx] = useState(0);

  const ready = Boolean(service && audience);

  // Initialise the Cal.com embed UI once (theme + brand colour).
  useEffect(() => {
    if (!SITE.bookingConfigured) return;
    let cancelled = false;
    (async () => {
      const cal = await getCalApi();
      if (cancelled) return;
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#C4633A" },
          dark: { "cal-brand": "#C4633A" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const calLink =
    service && audience ? calLinkForService(service, audience) : null;

  const variant = service?.variants[variantIdx] ?? service?.variants[0];
  const noteText =
    service && variant
      ? `${localized(service.name, locale)} — ${localized(variant.label, locale)} (${variant.durationMin} min)`
      : undefined;

  const audiences: { value: Audience; label: string }[] = [
    { value: "women", label: localized(SITE.hours.women.label, locale) },
    { value: "men", label: localized(SITE.hours.men.label, locale) },
  ];

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
      {/* LEFT: picker */}
      <div>
        {/* Step 1 — audience */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-3">
            {dict.audience}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {audiences.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAudience(a.value)}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 border transition-all",
                  audience === a.value
                    ? "border-deep-brown bg-deep-brown text-cream"
                    : "border-border bg-cream text-deep-brown hover:border-deep-brown",
                )}
              >
                <span className="serif text-base">{a.label}</span>
                {audience === a.value && (
                  <Check size={14} className="text-cream shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — treatment */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-3">
            {dict.step1}
          </p>
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => {
                  setService(s);
                  setVariantIdx(0);
                }}
                className={clsx(
                  "w-full text-left flex items-center justify-between gap-3 px-4 py-3 border transition-all",
                  service?.slug === s.slug
                    ? "border-deep-brown bg-deep-brown text-cream"
                    : "border-border bg-cream text-deep-brown hover:border-deep-brown",
                )}
              >
                <span className="serif text-base">
                  {localized(s.name, locale)}
                </span>
                {service?.slug === s.slug && (
                  <Check size={14} className="text-cream shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {service && service.variants.length > 1 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-3">
              {locale === "nl" ? "Duur" : "Duration"}
            </p>
            <div className="flex flex-wrap gap-2">
              {service.variants.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setVariantIdx(i)}
                  className={clsx(
                    "px-4 py-2 border text-sm transition-all",
                    variantIdx === i
                      ? "bg-terracotta border-terracotta text-cream"
                      : "border-border text-deep-brown hover:border-deep-brown",
                  )}
                >
                  {localized(v.label, locale)} · {v.durationMin} min ·{" "}
                  {formatPriceEUR(v.priceCents, locale)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 p-5 bg-sand/30 border border-border/40 text-sm">
          <p className="font-medium text-deep-brown mb-3">{dict.hoursTitle}</p>
          <p
            className={clsx(
              "mb-1",
              audience === "women"
                ? "text-deep-brown font-medium"
                : "text-muted",
            )}
          >
            {dict.hoursWomen}
          </p>
          <p
            className={clsx(
              "mb-3",
              audience === "men" ? "text-deep-brown font-medium" : "text-muted",
            )}
          >
            {dict.hoursMen}
          </p>
          <p className="text-xs text-muted/80">{dict.byAppointment}</p>
        </div>
      </div>

      {/* RIGHT: Cal.com embed (or fallback) */}
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-3">
          {dict.step2}
        </p>
        {ready && service && calLink ? (
          SITE.bookingConfigured ? (
            <div className="bg-cream border border-border/60 min-h-[700px] overflow-hidden">
              <Cal
                key={calLink}
                calLink={calLink}
                style={{ width: "100%", height: "700px", overflow: "auto" }}
                config={{
                  layout: "month_view",
                  ...(noteText ? { notes: noteText } : {}),
                }}
              />
            </div>
          ) : (
            <div className="bg-sand/20 border border-border min-h-[400px] p-8 lg:p-12 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-4">
                {locale === "nl" ? "Reserveren" : "Booking"}
              </p>
              <p className="serif text-2xl text-deep-brown leading-snug mb-4">
                {locale === "nl"
                  ? `Bel of mail om uw afspraak voor ${localized(service.name, locale)} te bevestigen.`
                  : `Call or email to confirm your ${localized(service.name, locale)} appointment.`}
              </p>
              <p className="text-muted mb-6">
                {locale === "nl"
                  ? "Online reserveren volgt binnenkort."
                  : "Online booking is coming soon."}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={SITE.phoneLink} className="btn-primary">
                  {SITE.phone}
                </a>
                <a
                  href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Reservering: ${localized(service.name, locale)}`)}`}
                  className="btn-secondary"
                >
                  {SITE.email}
                </a>
              </div>
            </div>
          )
        ) : (
          <div className="bg-sand/20 border border-dashed border-border min-h-[400px] flex items-center justify-center p-12">
            <p className="text-muted text-center max-w-sm">{dict.noService}</p>
          </div>
        )}
      </div>
    </div>
  );
}

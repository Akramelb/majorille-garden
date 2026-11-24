"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import {
  SERVICES,
  SITE,
  formatPriceEUR,
  localized,
  servicesByDepartment,
  type Audience,
  type Service,
} from "@/lib/content";
import {
  createBookingPayment,
  type FormState,
} from "@/lib/booking-actions";
import type { Locale } from "@/app/[lang]/dictionaries";
import { AvailabilityDialog } from "@/components/sections/AvailabilityDialog";

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
  payNow: string;
  confirming: string;
  paymentFailed: string;
  retry: string;
  afterPayment: string;
  contactFields: {
    email: string;
    name: string;
    phone: string;
  };
};

function errorCopy(code: string, locale: Locale): string {
  if (code === "payments-disabled") {
    return locale === "nl"
      ? "Betalingen zijn momenteel niet beschikbaar, bel of mail ons om te boeken."
      : "Payments are temporarily unavailable, please call or email us to book.";
  }
  return locale === "nl"
    ? "Er ging iets mis, probeer opnieuw."
    : "Something went wrong, please try again.";
}

function SubmitButton({
  label,
  busyLabel,
  priceLabel,
  disabled,
}: {
  label: string;
  busyLabel: string;
  priceLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed flex-wrap"
    >
      <span>{pending ? busyLabel : label}</span>
      <span className="text-cream/80">·</span>
      <span>{priceLabel}</span>
    </button>
  );
}

export function BookingForm({
  dict,
  locale,
  initialSlug,
  initialPromoCode = null,
  initialPromoPercent = null,
}: {
  dict: Dict;
  locale: Locale;
  initialSlug?: string;
  initialPromoCode?: string | null;
  initialPromoPercent?: number | null;
}) {
  const initial = SERVICES.find((s) => s.slug === initialSlug) ?? null;
  const [audience, setAudience] = useState<Audience | null>(null);
  const [service, setService] = useState<Service | null>(initial);
  const [variantIdx, setVariantIdx] = useState(0);

  const [state, formAction] = useActionState<FormState, FormData>(
    createBookingPayment,
    null,
  );

  const variant = service?.variants[variantIdx] ?? service?.variants[0];
  const ready = Boolean(service && audience && variant);
  const priceLabel = variant
    ? formatPriceEUR(variant.priceCents, locale)
    : "";

  const audiences: { value: Audience; label: string }[] = [
    { value: "women", label: localized(SITE.hours.women.label, locale) },
    { value: "men", label: localized(SITE.hours.men.label, locale) },
  ];

  // Fallback (rule 21): no Cal.com username, no payments either — surface the
  // phone/email path so guests can still book.
  if (!SITE.bookingConfigured) {
    return (
      <div className="bg-sand/20 border border-border p-8 lg:p-12">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-4">
          {locale === "nl" ? "Reserveren" : "Booking"}
        </p>
        <p className="serif text-2xl text-deep-brown leading-snug mb-4">
          {locale === "nl"
            ? "Bel of mail om uw afspraak te bevestigen."
            : "Call or email to confirm your appointment."}
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
          <a href={`mailto:${SITE.email}`} className="btn-secondary">
            {SITE.email}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 min-w-0">
      <StepBar locale={locale} />

      {/* LEFT: picker */}
      <div className="min-w-0">
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
                aria-pressed={audience === a.value}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 border transition-all",
                  audience === a.value
                    ? "border-deep-brown bg-deep-brown text-cream"
                    : "border-border bg-cream text-deep-brown hover:border-deep-brown",
                )}
              >
                <span className="serif text-base">{a.label}</span>
                {audience === a.value && (
                  <Check size={14} className="text-cream shrink-0" aria-hidden="true" />
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
          <div className="space-y-6">
            {servicesByDepartment().map((d) => (
              <div key={d.id} role="group" aria-label={localized(d.name, locale)}>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted mb-2">
                  {localized(d.name, locale)}
                </p>
                <div className="space-y-2">
                  {d.services.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => {
                        setService(s);
                        setVariantIdx(0);
                      }}
                      aria-pressed={service?.slug === s.slug}
                      className={clsx(
                        "w-full text-left flex items-center justify-between gap-3 px-4 py-3 border transition-all min-w-0",
                        service?.slug === s.slug
                          ? "border-deep-brown bg-deep-brown text-cream"
                          : "border-border bg-cream text-deep-brown hover:border-deep-brown",
                      )}
                    >
                      <span className="serif text-base break-words min-w-0">
                        {localized(s.name, locale)}
                      </span>
                      {service?.slug === s.slug && (
                        <Check size={14} className="text-cream shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
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
                  aria-pressed={variantIdx === i}
                  className={clsx(
                    "px-4 py-2 border text-sm transition-all break-words text-left",
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
          <p className="text-xs text-muted">{dict.byAppointment}</p>
        </div>
      </div>

      {/* RIGHT: contact fields + pay button */}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-3">
          {dict.step2}
        </p>

        {ready ? (
          <div className="bg-cream border border-border/60 p-6 lg:p-8 space-y-5">
            {/* Read-only availability: rendered by us from /api/availability.
                Nothing here can create a Cal.com booking; the guest picks the
                real slot on the return page after payment. */}
            {service && audience && (
              <div className="bg-sand/30 border border-border/50 p-4 sm:p-5 -mb-1 space-y-3">
                <p className="text-sm text-deep-brown leading-snug">
                  {locale === "nl"
                    ? "Benieuwd wanneer we vrij zijn? Bekijk de vrije dagen. Je tijd kies je na de betaling."
                    : "Curious when we're free? See the free days. You pick your time after payment."}
                </p>
                <AvailabilityDialog
                  key={`${service.slug}-${audience}`}
                  serviceSlug={service.slug}
                  audience={audience}
                  locale={locale}
                  onContinue={() =>
                    document
                      .querySelector<HTMLInputElement>('input[name="email"]')
                      ?.focus()
                  }
                />
              </div>
            )}

            <Field
              label={dict.contactFields.email}
              name="email"
              type="email"
              required
            />
            <Field
              label={dict.contactFields.name}
              name="name"
              required
            />
            <Field
              label={dict.contactFields.phone}
              name="phone"
              type="tel"
            />

            {/* Hidden mirrors of the picker state */}
            <input type="hidden" name="audience" value={audience ?? ""} />
            <input type="hidden" name="serviceSlug" value={service?.slug ?? ""} />
            <input type="hidden" name="variantIdx" value={String(variantIdx)} />
            <input type="hidden" name="lang" value={locale} />
            {initialPromoCode && (
              <input type="hidden" name="promoCode" value={initialPromoCode} />
            )}

            {initialPromoCode && initialPromoPercent !== null && (
              <div
                className="px-4 py-3 bg-olive/10 border border-olive/40 text-sm text-deep-brown flex items-center gap-3"
                aria-live="polite"
              >
                <span className="text-xs uppercase tracking-[0.18em] text-olive font-medium">
                  {locale === "nl" ? "Korting" : "Discount"}
                </span>
                <code className="font-mono tracking-[0.18em] bg-deep-brown text-cream px-2 py-1 text-xs">
                  {initialPromoCode}
                </code>
                <span>
                  −{initialPromoPercent}%{" "}
                  {locale === "nl"
                    ? "wordt automatisch toegepast"
                    : "applied automatically"}
                </span>
              </div>
            )}

            <div className="pt-2">
              <SubmitButton
                label={dict.payNow}
                busyLabel={
                  locale === "nl" ? "Doorsturen…" : "Redirecting…"
                }
                priceLabel={priceLabel}
              />
            </div>

            {state && !state.ok && state.message && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-sm text-terracotta border border-terracotta/40 bg-terracotta/5 px-4 py-3"
              >
                {errorCopy(state.message, locale)}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-sand/20 border border-dashed border-border min-h-[240px] sm:min-h-[400px] flex items-center justify-center p-8 sm:p-12">
            <p className="text-muted text-center max-w-sm">{dict.noService}</p>
          </div>
        )}
      </div>
    </form>
  );
}

function StepBar({ locale }: { locale: Locale }) {
  const nl = locale === "nl";
  const steps = [
    { label: nl ? "Behandeling" : "Treatment", current: true },
    { label: nl ? "Betalen" : "Payment" },
    {
      label: nl ? "Tijd kiezen" : "Choose time",
      note: nl ? "na betaling" : "after payment",
    },
  ];
  return (
    <ol className="lg:col-span-2 flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <li
          key={s.label}
          aria-current={s.current ? "step" : undefined}
          className={clsx(
            "flex items-start gap-2 sm:gap-3 min-w-0",
            s.note ? "text-muted" : s.current ? "text-deep-brown font-medium" : "text-deep-brown",
          )}
        >
          {i > 0 && (
            <span aria-hidden="true" className="text-border">
              /
            </span>
          )}
          <span className="min-w-0">
            <span className="block">
              {i + 1} {s.label}
            </span>
            {s.note && (
              <span className="block text-[0.65rem] uppercase tracking-[0.12em]">
                {s.note}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        aria-required={required || undefined}
        className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-base outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
      />
    </label>
  );
}

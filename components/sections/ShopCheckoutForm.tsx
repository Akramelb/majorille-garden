"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  formatPriceEUR,
  localized,
  type Product,
} from "@/lib/content";
import {
  createShopPayment,
  type FormState,
} from "@/lib/shop-actions";

type ShopCheckoutDict = {
  title: string;
  shippingTitle: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  countryNL: string;
  pay: string;
  qty: string;
  summary: string;
  nlOnly: string;
};

type Lang = "nl" | "en";

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? busy : idle}
    </button>
  );
}

function errorMessage(code: string, lang: Lang, dict: ShopCheckoutDict): string {
  if (code === "nl-only") return dict.nlOnly;
  if (code === "payments-disabled") {
    return lang === "nl"
      ? "Betalingen zijn momenteel niet beschikbaar."
      : "Payments are temporarily unavailable.";
  }
  return lang === "nl"
    ? "Er ging iets mis, probeer opnieuw."
    : "Something went wrong, please try again.";
}

export function ShopCheckoutForm({
  product,
  lang,
  dict,
  initialPromoCode,
  initialPromoPercent,
}: {
  product: Product;
  lang: Lang;
  dict: ShopCheckoutDict;
  initialPromoCode: string | null;
  initialPromoPercent: number | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createShopPayment,
    null,
  );

  const productName = localized(product.name, lang);
  const productDesc = localized(product.shortDescription, lang);
  const unitPriceLabel = formatPriceEUR(product.priceCents, lang);

  const labels = {
    email: lang === "nl" ? "E-mail" : "Email",
    name: lang === "nl" ? "Naam" : "Name",
    phone: lang === "nl" ? "Telefoon (optioneel)" : "Phone (optional)",
    contactTitle: lang === "nl" ? "Contactgegevens" : "Contact details",
    busy: lang === "nl" ? "Bezig…" : "Processing…",
    qtyOf: lang === "nl" ? "× " : "× ",
    unit: lang === "nl" ? "per stuk" : "each",
    total: lang === "nl" ? "Totaal" : "Total",
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 min-w-0">
      {/* Product summary */}
      <aside className="bg-cream lg:p-8 lg:border lg:border-border/40 min-w-0">
        <div className="relative aspect-square bg-sand/30 overflow-hidden">
          <Image
            src={product.image}
            alt={productName}
            fill
            sizes="(min-width:1024px) 35vw, 100vw"
            className="object-cover"
          />
        </div>
        <h2 className="mt-6 serif text-2xl text-deep-brown">{productName}</h2>
        <p className="mt-2 text-sm text-muted">{productDesc}</p>
        <p className="mt-4 serif text-2xl text-deep-brown">
          {unitPriceLabel}{" "}
          <span className="text-sm text-muted font-normal">{labels.unit}</span>
        </p>
      </aside>

      {/* Form */}
      <form action={formAction} className="space-y-8 min-w-0">
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="country" value="NL" />
        {initialPromoCode && (
          <input type="hidden" name="promoCode" value={initialPromoCode} />
        )}

        {initialPromoCode && initialPromoPercent !== null && (
          <div
            className="px-4 py-3 bg-olive/10 border border-olive/40 text-sm text-deep-brown flex items-center gap-3"
            aria-live="polite"
          >
            <span className="text-xs uppercase tracking-[0.18em] text-olive font-medium">
              {lang === "nl" ? "Korting" : "Discount"}
            </span>
            <code className="font-mono tracking-[0.18em] bg-deep-brown text-cream px-2 py-1 text-xs">
              {initialPromoCode}
            </code>
            <span>
              −{initialPromoPercent}%{" "}
              {lang === "nl"
                ? "wordt automatisch toegepast bij Mollie"
                : "applied automatically at Mollie"}
            </span>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
              {dict.qty}
            </span>
            <select
              name="qty"
              defaultValue="1"
              className="w-full sm:w-32 px-4 py-3 bg-cream border border-border text-deep-brown outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Contact */}
        <fieldset className="space-y-5">
          <legend className="serif text-xl text-deep-brown mb-2">
            {labels.contactTitle}
          </legend>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label={labels.name} name="name" required />
            <Field label={labels.email} name="email" type="email" required />
          </div>
          <Field label={labels.phone} name="phone" type="tel" />
        </fieldset>

        {/* Shipping address */}
        <fieldset className="space-y-5">
          <legend className="serif text-xl text-deep-brown mb-2">
            {dict.shippingTitle}
          </legend>
          <Field label={dict.addressLine1} name="address_line1" required />
          <Field label={dict.addressLine2} name="address_line2" />
          <div className="grid sm:grid-cols-[1fr_2fr] gap-5">
            <Field label={dict.postalCode} name="postal_code" required />
            <Field label={dict.city} name="city" required />
          </div>
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
              {dict.country}
            </span>
            <input
              type="text"
              value={dict.countryNL}
              readOnly
              aria-readonly
              className="w-full px-4 py-3 bg-sand/30 border border-border text-deep-brown outline-none cursor-not-allowed"
            />
            <span className="block mt-2 text-xs text-muted">{dict.nlOnly}</span>
          </label>
        </fieldset>

        {/* Summary */}
        <div className="border-t border-border/60 pt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted mb-3">
            {dict.summary}
          </p>
          <div className="flex flex-wrap justify-between gap-2 text-sm text-deep-brown">
            <span className="min-w-0 break-words">
              <SummaryQty productName={productName} />
            </span>
            <span className="shrink-0">{unitPriceLabel}</span>
          </div>
          <Total product={product} lang={lang} totalLabel={labels.total} />
        </div>

        {/* Error banner */}
        {state && !state.ok && (
          <div
            className="px-4 py-3 bg-terracotta/10 border border-terracotta/40 text-sm text-terracotta"
            role="alert"
          >
            {errorMessage(state.message, lang, dict)}
          </div>
        )}

        <SubmitButton idle={dict.pay} busy={labels.busy} />
      </form>
    </div>
  );
}

/**
 * Server-action returns no qty in state — the summary line just shows the
 * label statically. We rely on the qty select to be the source of truth and
 * keep the visible summary minimal (the Mollie checkout shows the real total).
 */
function SummaryQty({ productName }: { productName: string }) {
  return <>1 × {productName}</>;
}

function Total({
  product,
  lang,
  totalLabel,
}: {
  product: Product;
  lang: Lang;
  totalLabel: string;
}) {
  return (
    <div className="mt-3 flex justify-between serif text-lg text-deep-brown">
      <span>{totalLabel}</span>
      <span>
        {formatPriceEUR(product.priceCents, lang)}
        <span className="text-xs text-muted ml-2">
          (× {lang === "nl" ? "aantal" : "qty"})
        </span>
      </span>
    </div>
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
        className="w-full px-4 py-3 bg-cream border border-border text-deep-brown outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
      />
    </label>
  );
}

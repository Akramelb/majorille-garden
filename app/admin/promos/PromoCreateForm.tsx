"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createPromo,
  type PromoActionResult,
} from "@/lib/promo-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-60"
    >
      {pending ? "Toevoegen…" : "Code toevoegen"}
    </button>
  );
}

function StatusLine({ result }: { result: PromoActionResult }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p className="text-sm text-olive">
        Toegevoegd. De code is direct actief op de site.
      </p>
    );
  }
  const human =
    result.message === "code-exists"
      ? "Deze code bestaat al."
      : result.message === "invalid-code-format"
        ? "Code moet 3–32 hoofdletters/cijfers zijn (geen spaties of speciale tekens)."
        : result.message === "invalid-discount"
          ? "Korting moet een heel getal tussen 1 en 100 zijn."
          : result.message === "invalid-applies"
            ? "Kies producten of boekingen."
            : result.message === "missing-labels"
              ? "Vul beide labels (NL en EN) in."
              : result.message === "invalid-expires"
                ? "Verloopdatum is geen geldige datum."
                : `Mislukt: ${result.message}`;
  return <p className="text-sm text-terracotta-dark">{human}</p>;
}

export function PromoCreateForm() {
  const [state, formAction] = useActionState<PromoActionResult, FormData>(
    createPromo,
    null,
  );
  // Reset the form when a create succeeds. We re-key the form so React
  // throws the old DOM away, clearing every input without manual reset().
  const [key, setKey] = useState(0);
  const [lastOk, setLastOk] = useState(false);
  if (state?.ok && !lastOk) {
    setLastOk(true);
    setKey((k) => k + 1);
  }
  if (state && !state.ok && lastOk) {
    setLastOk(false);
  }

  return (
    <form
      key={key}
      action={formAction}
      className="bg-cream border border-border/60 p-5 sm:p-6 max-w-2xl space-y-5"
    >
      <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-end">
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Code
          </span>
          <input
            name="code"
            required
            placeholder="ZOMER15"
            maxLength={32}
            pattern="[A-Za-z0-9]{3,32}"
            onInput={(e) => {
              const t = e.currentTarget;
              t.value = t.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            }}
            className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm tracking-[0.18em] font-mono uppercase outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Korting %
          </span>
          <input
            type="number"
            name="discount_percent"
            required
            min="1"
            max="100"
            defaultValue="10"
            className="w-28 px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
      </div>

      <fieldset>
        <legend className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          Geldt voor
        </legend>
        <div className="flex flex-wrap gap-4 text-sm text-deep-brown">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="applies"
              value="product"
              defaultChecked
              required
            />
            Producten (shop)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="applies" value="booking" required />
            Boekingen
          </label>
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Tekst (NL)
          </span>
          <input
            name="label_nl"
            required
            placeholder="15% korting op alle producten"
            maxLength={120}
            className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Tekst (EN)
          </span>
          <input
            name="label_en"
            required
            placeholder="15% off all products"
            maxLength={120}
            className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-end">
        <label className="flex items-center gap-2 text-sm text-deep-brown">
          <input type="checkbox" name="active" defaultChecked />
          Direct actief
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Verloopdatum (optioneel)
          </span>
          <input
            type="date"
            name="expires_at"
            className="px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton />
        <StatusLine result={state} />
      </div>
    </form>
  );
}

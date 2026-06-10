"use client";

import { useState, useTransition } from "react";
import { togglePromo, deletePromo } from "@/lib/promo-actions";
import type { Promo } from "@/lib/promos";

/**
 * One row in the promo list. Toggle = soft-disable (active flag), Delete =
 * hard-remove (DB row gone). Delete asks for confirmation because it can't
 * be undone — past order line items lose their human-readable promo
 * context.
 */
export function PromoRow({ promo }: { promo: Promo }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(promo.active);
  const [hidden, setHidden] = useState(false);
  // Snapshot "now" once at mount so expiry status doesn't churn between
  // re-renders (and satisfies react-hooks/purity — `Date.now()` is impure
  // when called during render).
  const [nowMs] = useState(() => Date.now());

  const expired =
    promo.expiresAt !== null &&
    new Date(promo.expiresAt).getTime() < nowMs;
  const live = active && !expired;

  if (hidden) return null;

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const res = await togglePromo(promo.id, !active);
      if (res?.ok) setActive(!active);
      else setError(res?.message ?? "error");
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Code ${promo.code} echt verwijderen? Dit kan niet ongedaan gemaakt worden.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deletePromo(promo.id);
      if (res?.ok) setHidden(true);
      else setError(res?.message ?? "error");
    });
  };

  const statusPill = expired
    ? { cls: "bg-sand/60 text-muted", label: "Verlopen" }
    : active
      ? { cls: "bg-olive/15 text-olive", label: "Actief" }
      : { cls: "bg-cream text-muted border border-border/60", label: "Inactief" };

  return (
    <div className="bg-cream border border-border/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <code className="px-3 py-1.5 bg-deep-brown text-cream font-mono text-sm tracking-[0.18em]">
          {promo.code}
        </code>
        <span className="text-deep-brown text-sm">
          −{promo.discountPercent}%
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          {promo.applies === "product" ? "Producten" : "Boekingen"}
        </span>
        <span
          className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 ${statusPill.cls}`}
        >
          {statusPill.label}
        </span>
        {promo.expiresAt && !expired && (
          <span className="text-xs text-muted">
            verloopt{" "}
            {new Intl.DateTimeFormat("nl-NL", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(promo.expiresAt))}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-deep-brown">{promo.labelNl}</p>
      <p className="text-xs text-muted">{promo.labelEn}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="text-xs uppercase tracking-[0.18em] text-deep-brown hover:text-terracotta-dark disabled:opacity-60"
        >
          {live ? "Uitschakelen" : "Inschakelen"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-terracotta-dark disabled:opacity-60"
        >
          Verwijderen
        </button>
        {error && (
          <span className="text-xs text-terracotta-dark">Mislukt: {error}</span>
        )}
      </div>
    </div>
  );
}

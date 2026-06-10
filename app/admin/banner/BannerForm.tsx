"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateAnnouncement,
  type AnnouncementResult,
} from "@/lib/admin-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:opacity-60"
    >
      {pending ? "Opslaan…" : "Opslaan"}
    </button>
  );
}

function StatusLine({ result }: { result: AnnouncementResult }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p className="text-sm text-olive">
        Opgeslagen. Vernieuw de homepage om de balk te zien.
      </p>
    );
  }
  const human =
    result.message === "missing-text"
      ? "Vul minstens één tekst in (NL of EN)."
      : result.message === "too-long"
        ? "Tekst is te lang — houd het onder 200 tekens."
        : `Mislukt: ${result.message}`;
  return <p className="text-sm text-terracotta-dark">{human}</p>;
}

export function BannerForm({
  initialEnabled,
  initialTextNl,
  initialTextEn,
}: {
  initialEnabled: boolean;
  initialTextNl: string;
  initialTextEn: string;
}) {
  const [state, formAction] = useActionState<AnnouncementResult, FormData>(
    updateAnnouncement,
    null,
  );
  // Local controlled state for the live preview line below the form. We
  // don't need to round-trip these through the server before showing what
  // the visitor will read.
  const [enabled, setEnabled] = useState(initialEnabled);
  const [textNl, setTextNl] = useState(initialTextNl);
  const [textEn, setTextEn] = useState(initialTextEn);

  return (
    <form
      action={formAction}
      className="bg-cream border border-border/60 p-5 sm:p-6 space-y-5"
    >
      <label className="flex items-center gap-3 text-deep-brown">
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm">
          Balk tonen op de site (anders is hij verborgen)
        </span>
      </label>

      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          Tekst (NL)
        </span>
        <input
          type="text"
          name="text_nl"
          value={textNl}
          onChange={(e) => setTextNl(e.target.value)}
          maxLength={200}
          placeholder="bv. Gebruik code ZOMER15 voor 15% korting"
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      </label>

      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          Tekst (EN)
        </span>
        <input
          type="text"
          name="text_en"
          value={textEn}
          onChange={(e) => setTextEn(e.target.value)}
          maxLength={200}
          placeholder="e.g. Use code SUMMER15 for 15% off"
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      </label>

      {enabled && (textNl || textEn) && (
        <div>
          <p className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
            Voorbeeld
          </p>
          <div className="bg-deep-brown text-cream/90 text-xs h-9 flex items-center px-4 overflow-hidden">
            <span className="uppercase tracking-[0.18em] truncate">
              {textNl || textEn}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <SubmitButton />
        <StatusLine result={state} />
      </div>
    </form>
  );
}

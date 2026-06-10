"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  uploadHeroImage,
  clearHeroImage,
  type HeroUploadResult,
} from "@/lib/admin-actions";
import type { HeroSlot } from "@/lib/site-settings";

function StatusMessage({ result }: { result: HeroUploadResult }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p className="text-sm text-olive">
        Opgeslagen. Vernieuw de homepage om de nieuwe foto te zien.
      </p>
    );
  }
  const human =
    result.message === "file-too-large"
      ? "Bestand is groter dan 10 MB."
      : result.message === "invalid-type"
        ? "Alleen JPG, PNG of WebP toegestaan."
        : result.message === "no-file"
          ? "Kies eerst een bestand."
          : `Mislukt: ${result.message}`;
  return <p className="text-sm text-terracotta-dark">{human}</p>;
}

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary text-sm disabled:opacity-60"
    >
      {pending ? "Uploaden…" : "Vervang foto"}
    </button>
  );
}

function ClearButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-muted hover:text-terracotta-dark disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Terugzetten naar standaard"}
    </button>
  );
}

export function HeroImageRow({
  slot,
  label,
  hint,
  fallbackSrc,
  currentUrl,
}: {
  slot: HeroSlot;
  label: string;
  hint: string;
  fallbackSrc: string;
  currentUrl: string | null;
}) {
  // Plain `<img>` here on purpose — admin preview, not LCP. next/image would
  // need supabase storage URLs whitelisted per slot, which is overkill for
  // a small thumbnail nobody reaches without an admin session.
  const previewSrc = currentUrl ?? fallbackSrc;
  const isOverride = Boolean(currentUrl);
  const [uploadState, uploadAction] = useActionState<HeroUploadResult, FormData>(
    uploadHeroImage,
    null,
  );
  const [clearState, clearAction] = useActionState<HeroUploadResult, FormData>(
    clearHeroImage,
    null,
  );
  const [fileName, setFileName] = useState<string | null>(null);

  // Show whichever action returned a result. Upload wins if both fired
  // (rare in practice — they're triggered from separate buttons).
  const latest = uploadState ?? clearState;

  return (
    <div className="bg-cream border border-border/60 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
        <div className="sm:w-48 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt={`Huidige ${label}`}
            className="w-full h-32 sm:h-36 object-cover border border-border/40"
          />
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted">
            {isOverride ? "Aangepast" : "Standaard"}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="serif text-lg text-deep-brown">{label}</h3>
          <p className="mt-1 text-sm text-muted leading-relaxed">{hint}</p>

          <form action={uploadAction} className="mt-4 space-y-3">
            <input type="hidden" name="slot" value={slot} />
            <label className="block">
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name ?? null)
                }
                className="block w-full text-sm text-deep-brown file:mr-3 file:py-2 file:px-3 file:border file:border-border file:bg-sand/30 file:text-deep-brown file:text-xs file:uppercase file:tracking-[0.18em] hover:file:bg-sand/60"
              />
            </label>
            {fileName && (
              <p className="text-xs text-muted truncate">{fileName}</p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <UploadButton />
              {isOverride && (
                <form action={clearAction} className="inline">
                  <input type="hidden" name="slot" value={slot} />
                  <ClearButton />
                </form>
              )}
            </div>
            <StatusMessage result={latest} />
          </form>
        </div>
      </div>
    </div>
  );
}

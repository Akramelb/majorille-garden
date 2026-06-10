"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Locale } from "@/app/[lang]/dictionaries";

const STORAGE_KEY = "mg-cookie-consent-v1";

// Subscribe to storage events so the consent flag stays in sync across tabs.
function subscribeStorage(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
// "hidden" sentinel keeps the banner suppressed during SSR + initial paint
// (we have no localStorage server-side); the client snapshot reflects reality.
function readConsent(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "missing";
  } catch {
    return "missing";
  }
}
function ssrConsent(): string {
  return "hidden";
}

const COPY: Record<Locale, { title: string; body: string; accept: string; learn: string }> = {
  nl: {
    title: "Cookies",
    body: "Deze site gebruikt technische cookies en privacyvriendelijke analytics (Vercel) zonder cookies. Bij het plannen van een afspraak of afrekenen worden ook cookies geplaatst door Cal.com en Mollie — meer in onze privacyverklaring.",
    accept: "Begrepen",
    learn: "Privacy",
  },
  en: {
    title: "Cookies",
    body: "This site uses technical cookies and privacy-friendly analytics (Vercel) without cookies. When you schedule an appointment or check out, cookies are also set by Cal.com and Mollie — see our privacy policy for details.",
    accept: "Got it",
    learn: "Privacy",
  },
};

export function CookieBanner({ locale }: { locale: Locale }) {
  // useSyncExternalStore reads localStorage on the client without a setState-in-effect.
  // SSR snapshot returns null → banner stays hidden during prerender (correct: no
  // server-side localStorage), then hydrates to its real value.
  const stored = useSyncExternalStore(subscribeStorage, readConsent, ssrConsent);
  const [dismissed, setDismissed] = useState(false);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  if (dismissed || stored !== "missing") return null;
  const t = COPY[locale];
  return (
    <div
      role="region"
      aria-label={locale === "nl" ? "Cookie melding" : "Cookie notice"}
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-sm z-50 bg-deep-brown text-cream shadow-2xl"
    >
      <div className="p-5 pr-12">
        <p className="text-xs uppercase tracking-[0.18em] text-terracotta mb-2">
          {t.title}
        </p>
        <p className="text-sm leading-relaxed text-cream/85">{t.body}</p>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={accept}
            className="bg-terracotta hover:bg-terracotta-dark text-cream px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors"
          >
            {t.accept}
          </button>
          <Link
            href={`/${locale}/privacy`}
            className="text-xs uppercase tracking-[0.18em] text-cream/70 hover:text-cream underline underline-offset-4"
          >
            {t.learn}
          </Link>
        </div>
        <button
          type="button"
          onClick={accept}
          aria-label={locale === "nl" ? "Sluiten" : "Close"}
          className="absolute top-3 right-3 text-cream/70 hover:text-cream p-1"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

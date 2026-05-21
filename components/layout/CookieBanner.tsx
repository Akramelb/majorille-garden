"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Locale } from "@/app/[lang]/dictionaries";

const STORAGE_KEY = "mg-cookie-consent-v1";

const COPY: Record<Locale, { title: string; body: string; accept: string; learn: string }> = {
  nl: {
    title: "Cookies",
    body: "Wij gebruiken alleen technische cookies die nodig zijn om de site te laten werken. Geen tracking, geen marketing.",
    accept: "Begrepen",
    learn: "Privacy",
  },
  en: {
    title: "Cookies",
    body: "We only use technical cookies required to run the site. No tracking, no marketing.",
    accept: "Got it",
    learn: "Privacy",
  },
};

export function CookieBanner({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setShow(true);
    } catch {
      // ignore (private mode)
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  };

  if (!show) return null;
  const t = COPY[locale];
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-sm z-50 bg-deep-brown text-cream shadow-2xl">
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
          aria-label="Close"
          className="absolute top-3 right-3 text-cream/60 hover:text-cream p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

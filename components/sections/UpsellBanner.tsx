"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ArrowRight } from "lucide-react";

/**
 * Cross-sell card shown on return pages after a successful purchase. The
 * parent server component resolves the promo (via `lib/promos.ts` →
 * Supabase) and passes its display fields down so this component stays
 * client-only and free of DB / server-only imports.
 *
 * Customer can copy the code manually — `clipboard.writeText` only works in
 * secure contexts (HTTPS / localhost). On insecure contexts the copy button
 * silently does nothing; the code is still readable on screen.
 */
export function UpsellBanner({
  code,
  label,
  ctaHref,
  ctaLabel,
  lang,
}: {
  code: string;
  label: string;
  /** Path the CTA links to — promo is appended automatically. */
  ctaHref: string;
  ctaLabel: string;
  lang: "nl" | "en";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // No clipboard permission — code is still on-screen, ignore silently.
    }
  };

  const heading =
    lang === "nl"
      ? "Cadeautje van Majorille Garden"
      : "A little gift from Majorille Garden";
  const subhead =
    lang === "nl"
      ? "Gebruik deze code bij je volgende bestelling:"
      : "Use this code on your next order:";
  const copyLabel = copied
    ? lang === "nl"
      ? "Gekopieerd"
      : "Copied"
    : lang === "nl"
      ? "Kopieer code"
      : "Copy code";

  // Append the promo to the CTA so the receiving form prefills the hidden
  // field. Preserves any existing query params on the href.
  const href = ctaHref.includes("?")
    ? `${ctaHref}&promo=${code}`
    : `${ctaHref}?promo=${code}`;

  return (
    <aside
      aria-label={heading}
      className="my-10 bg-gradient-to-br from-terracotta/10 via-cream to-sand/30 border border-terracotta/30 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-terracotta-dark font-medium">
        {heading}
      </p>
      <p className="mt-3 serif text-2xl sm:text-3xl text-deep-brown">{label}</p>
      <p className="mt-3 text-sm text-muted">{subhead}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <code className="px-4 py-2.5 bg-deep-brown text-cream tracking-[0.32em] text-sm font-mono">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copyLabel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-deep-brown border border-border hover:border-deep-brown transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copyLabel}
        </button>
      </div>

      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-2 btn-primary"
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}

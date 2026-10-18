"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { Locale } from "@/app/[lang]/dictionaries";

export function LangSwitch({
  locale,
  onDark = false,
}: {
  locale: Locale;
  /** Rendered over the dark home hero: cream instead of brown. */
  onDark?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const swap = (target: Locale) => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "nl" || parts[0] === "en") parts[0] = target;
    else parts.unshift(target);
    return "/" + parts.join("/");
  };
  return (
    <div className="flex items-center gap-1 text-xs uppercase tracking-[0.18em]">
      <Link
        href={swap("nl")}
        className={clsx(
          "px-2 py-1 transition-colors",
          locale === "nl"
            ? onDark ? "text-cream font-semibold" : "text-deep-brown font-semibold"
            : onDark ? "text-cream/70 hover:text-cream" : "text-muted hover:text-deep-brown",
        )}
        aria-current={locale === "nl" ? "page" : undefined}
      >
        NL
      </Link>
      <span className={onDark ? "text-cream/50" : "text-muted/50"}>·</span>
      <Link
        href={swap("en")}
        className={clsx(
          "px-2 py-1 transition-colors",
          locale === "en"
            ? onDark ? "text-cream font-semibold" : "text-deep-brown font-semibold"
            : onDark ? "text-cream/70 hover:text-cream" : "text-muted hover:text-deep-brown",
        )}
        aria-current={locale === "en" ? "page" : undefined}
      >
        EN
      </Link>
    </div>
  );
}

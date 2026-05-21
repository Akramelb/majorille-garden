"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { Locale } from "@/app/[lang]/dictionaries";

export function LangSwitch({ locale }: { locale: Locale }) {
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
            ? "text-deep-brown font-semibold"
            : "text-muted hover:text-deep-brown",
        )}
        aria-current={locale === "nl" ? "page" : undefined}
      >
        NL
      </Link>
      <span className="text-muted/50">·</span>
      <Link
        href={swap("en")}
        className={clsx(
          "px-2 py-1 transition-colors",
          locale === "en"
            ? "text-deep-brown font-semibold"
            : "text-muted hover:text-deep-brown",
        )}
        aria-current={locale === "en" ? "page" : undefined}
      >
        EN
      </Link>
    </div>
  );
}

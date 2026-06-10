import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["nl", "en"] as const;
const DEFAULT_LOCALE = "nl";

function pickLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language");
  if (!accept) return DEFAULT_LOCALE;
  const wants = accept
    .split(",")
    .map((s) => s.trim().split(";")[0].toLowerCase().slice(0, 2));
  return wants.find((w) => (LOCALES as readonly string[]).includes(w)) ?? DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return;

  const locale = pickLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url);
  // The redirect target depends on Accept-Language — tell caches (and
  // crawlers) so an EN visitor never gets served a cached NL redirect.
  res.headers.set("Vary", "Accept-Language");
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|admin|auth|.*\\..*).*)"],
};

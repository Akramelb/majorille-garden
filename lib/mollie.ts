import "server-only";
import createMollieClient from "@mollie/api-client";

export type MollieClient = ReturnType<typeof createMollieClient>;

let cached: MollieClient | null = null;

export function hasMollieConfig(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

export function getMollieClient(): MollieClient {
  if (cached) return cached;
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Mollie env var missing — MOLLIE_API_KEY is required (test_xxx locally, live_xxx in production)",
    );
  }
  cached = createMollieClient({ apiKey });
  return cached;
}

/**
 * Convert integer cents to a Mollie-formatted euro decimal string.
 * Always returns 2 decimals, e.g. `1295` → `"12.95"`, `500` → `"5.00"`.
 */
export function centsToEuroString(cents: number): string {
  const safe = Math.round(cents);
  const euros = Math.trunc(safe / 100);
  const remainder = Math.abs(safe % 100);
  return `${euros}.${remainder.toString().padStart(2, "0")}`;
}

// `siteUrl()` re-exported from lib/seo.ts so the same canonical URL is used
// by SEO/JSON-LD, magic-link redirects, and Mollie return/webhook URLs.
// Single source of truth: `NEXT_PUBLIC_SITE_URL` env, with a production-safe
// hardcoded fallback. See lib/seo.ts for the implementation.
export { siteUrl } from "./seo";

import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";

/**
 * Promo codes — sourced from the `promo_codes` Supabase table so the admin
 * can add, toggle, and remove codes without a redeploy. The table is seeded
 * (via the SQL block in HANDOFF.md) with two cross-sell defaults:
 *
 *   - `BEDANKT10` — 10% off products. Surfaced on `/booking/return` to nudge
 *     paid-up bookers into the shop.
 *   - `BOEK10` — 10% off bookings. Surfaced on `/shop/return` to nudge
 *     paid-up shoppers into a treatment.
 *
 * Lookups go through `getPromo()` (case-insensitive) and `applyPromo()`. Both
 * are async because they touch Supabase; callers are already in async server
 * components / server actions so this is invisible at the call site. When
 * Supabase is unconfigured (local dev without env), both return null/no-op
 * so the rest of the flow keeps working.
 *
 * Codes are scoped by `applies` (product / booking) and enforced server-side
 * so a customer can't paste a booking code into the shop form to underpay.
 * `active = false` or an expired `expires_at` makes a code invisible to
 * `getPromo` (so admin can disable without losing history).
 */

export type PromoKind = "product" | "booking";

export type Promo = {
  id: string;
  code: string;
  discountPercent: number;
  applies: PromoKind;
  labelNl: string;
  labelEn: string;
  active: boolean;
  expiresAt: string | null;
};

type PromoRow = {
  id: string;
  code: string;
  discount_percent: number;
  applies: PromoKind;
  label_nl: string;
  label_en: string;
  active: boolean;
  expires_at: string | null;
};

function rowToPromo(r: PromoRow): Promo {
  return {
    id: r.id,
    code: r.code,
    discountPercent: r.discount_percent,
    applies: r.applies,
    labelNl: r.label_nl,
    labelEn: r.label_en,
    active: r.active,
    expiresAt: r.expires_at,
  };
}

function isLive(p: PromoRow): boolean {
  if (!p.active) return false;
  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return false;
  return true;
}

/**
 * Resolve a raw promo code to a Promo (or null). Case-insensitive. Returns
 * null for unknown / inactive / expired codes — call sites treat that as
 * "no discount applies" which is the safe default.
 */
export async function getPromo(
  raw: string | null | undefined,
): Promise<Promo | null> {
  if (!raw) return null;
  if (!hasSupabaseConfig()) return null;
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("promo_codes")
    .select(
      "id, code, discount_percent, applies, label_nl, label_en, active, expires_at",
    )
    .eq("code", code)
    .maybeSingle();
  if (error) {
    console.error("[promos] getPromo failed", error);
    return null;
  }
  const row = data as PromoRow | null;
  if (!row || !isLive(row)) return null;
  return rowToPromo(row);
}

/**
 * Apply a promo to an amount. Returns the discounted amount in cents,
 * rounded to the nearest cent. If the code is invalid or doesn't apply to
 * the given kind, returns the original amount untouched.
 *
 * Mollie has a €0.50 effective minimum — discounts that drop the total
 * below that are still allowed here (e.g. €1 product → €0.90), but the
 * call site should re-check the minimum if it cares.
 */
export async function applyPromo(
  amountCents: number,
  raw: string | null | undefined,
  kind: PromoKind,
): Promise<{ amountCents: number; applied: Promo | null }> {
  const promo = await getPromo(raw);
  if (!promo || promo.applies !== kind) {
    return { amountCents, applied: null };
  }
  const discounted = Math.round(amountCents * (1 - promo.discountPercent / 100));
  return { amountCents: discounted, applied: promo };
}

/**
 * Admin: list every promo code (active + inactive + expired) for the
 * management UI. Ordered newest first. Returns [] when Supabase is
 * unconfigured.
 */
export async function listPromos(): Promise<Promo[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("promo_codes")
    .select(
      "id, code, discount_percent, applies, label_nl, label_en, active, expires_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[promos] listPromos failed", error);
    return [];
  }
  return (data as PromoRow[]).map(rowToPromo);
}

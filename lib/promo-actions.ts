"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";
import type { PromoKind } from "@/lib/promos";

export type PromoActionResult = {
  ok: boolean;
  message: string;
} | null;

const KINDS = new Set<PromoKind>(["product", "booking"]);
const CODE_REGEX = /^[A-Z0-9]{3,32}$/;

/**
 * Revalidate every path that surfaces a promo so admin edits become visible
 * immediately. Return pages cache via `force-dynamic` but the shop list and
 * checkout pages benefit from an explicit bust.
 */
function revalidatePromoSurfaces() {
  revalidatePath("/admin/promos");
  revalidatePath("/nl/shop");
  revalidatePath("/en/shop");
  revalidatePath("/nl/booking");
  revalidatePath("/en/booking");
}

/**
 * Admin: create a new promo code. Form fields:
 *   - code, discount_percent, applies, label_nl, label_en, expires_at (optional)
 *
 * Returns ok/message — the admin page surfaces this via useActionState.
 */
export async function createPromo(
  _prev: PromoActionResult,
  formData: FormData,
): Promise<PromoActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  if (!hasSupabaseConfig()) return { ok: false, message: "no-supabase" };

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discount = Number(formData.get("discount_percent") ?? "0");
  const applies = String(formData.get("applies") ?? "");
  const labelNl = String(formData.get("label_nl") ?? "").trim();
  const labelEn = String(formData.get("label_en") ?? "").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!CODE_REGEX.test(code)) {
    return { ok: false, message: "invalid-code-format" };
  }
  if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
    return { ok: false, message: "invalid-discount" };
  }
  if (!KINDS.has(applies as PromoKind)) {
    return { ok: false, message: "invalid-applies" };
  }
  if (!labelNl || !labelEn) {
    return { ok: false, message: "missing-labels" };
  }

  let expiresAt: string | null = null;
  if (expiresRaw) {
    const parsed = new Date(expiresRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, message: "invalid-expires" };
    }
    expiresAt = parsed.toISOString();
  }

  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("promo_codes").insert({
    code,
    discount_percent: discount,
    applies,
    label_nl: labelNl,
    label_en: labelEn,
    active,
    expires_at: expiresAt,
  });
  if (error) {
    // 23505 = unique_violation → code already exists
    if (error.code === "23505") {
      return { ok: false, message: "code-exists" };
    }
    console.error("[promo] createPromo failed", error);
    return { ok: false, message: error.message };
  }

  revalidatePromoSurfaces();
  return { ok: true, message: "created" };
}

/**
 * Admin: toggle active flag. Soft-disable rather than delete so the code
 * stays in history (useful when analysing past orders).
 */
export async function togglePromo(
  id: string,
  active: boolean,
): Promise<PromoActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  if (!hasSupabaseConfig()) return { ok: false, message: "no-supabase" };

  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("promo_codes")
    .update({ active })
    .eq("id", id);
  if (error) {
    console.error("[promo] togglePromo failed", error);
    return { ok: false, message: error.message };
  }
  revalidatePromoSurfaces();
  return { ok: true, message: "toggled" };
}

/**
 * Admin: hard delete. Use sparingly — historical orders that referenced this
 * code will lose their human-readable context. Prefer `togglePromo` to
 * disable.
 */
export async function deletePromo(id: string): Promise<PromoActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  if (!hasSupabaseConfig()) return { ok: false, message: "no-supabase" };

  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("promo_codes").delete().eq("id", id);
  if (error) {
    console.error("[promo] deletePromo failed", error);
    return { ok: false, message: error.message };
  }
  revalidatePromoSurfaces();
  return { ok: true, message: "deleted" };
}

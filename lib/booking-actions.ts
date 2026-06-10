"use server";

import { redirect } from "next/navigation";

import { SERVICES } from "@/lib/content";
import {
  centsToEuroString,
  getMollieClient,
  hasMollieConfig,
  siteUrl,
} from "@/lib/mollie";
import { createOrder, updateOrder } from "@/lib/orders";
import { signOrderToken } from "@/lib/order-token";
import { applyPromo } from "@/lib/promos";
import { checkRateLimit } from "@/lib/ratelimit";
import { hasSupabaseConfig } from "@/lib/supabase";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

/**
 * Booking paywall Server Action. Validates input, derives the price from
 * SERVICES (never trusts the form), persists an `orders` row, creates a Mollie
 * payment, stores the Mollie ids on the order, and redirects to the hosted
 * checkout. The Cal.com embed is gated behind the webhook flipping the order
 * to `paid` (see app/api/mollie/webhook/route.ts).
 *
 * Form fields:
 *   - audience: "women" | "men"
 *   - serviceSlug: string (must exist in SERVICES)
 *   - variantIdx: numeric string (index into service.variants)
 *   - email: string (required)
 *   - name: string (optional)
 *   - phone: string (optional)
 *   - lang: "nl" | "en"
 */
export async function createBookingPayment(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const audience = String(fd.get("audience") ?? "").trim();
  const serviceSlug = String(fd.get("serviceSlug") ?? "").trim();
  const variantIdxRaw = String(fd.get("variantIdx") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const langRaw = String(fd.get("lang") ?? "nl").trim();
  const promoCode = String(fd.get("promoCode") ?? "").trim() || null;

  if (audience !== "women" && audience !== "men") {
    return { ok: false, message: "invalid-audience" };
  }
  if (!serviceSlug || !email || !variantIdxRaw) {
    return { ok: false, message: "missing-fields" };
  }
  if (!isEmail(email)) {
    return { ok: false, message: "invalid-email" };
  }
  if (tooLong(email, 200) || tooLong(name, 120) || tooLong(phone, 40)) {
    return { ok: false, message: "too-long" };
  }
  const rl = await checkRateLimit("payment");
  if (!rl.ok) return { ok: false, message: "rate-limited" };
  const lang: "nl" | "en" = langRaw === "en" ? "en" : "nl";

  const service = SERVICES.find((s) => s.slug === serviceSlug);
  if (!service) {
    return { ok: false, message: "unknown-service" };
  }

  const variantIdx = Number(variantIdxRaw);
  if (
    !Number.isInteger(variantIdx) ||
    variantIdx < 0 ||
    variantIdx >= service.variants.length
  ) {
    return { ok: false, message: "invalid-variant" };
  }

  // Re-derive the price server-side — never trust the form. Then run any
  // promo through `applyPromo`, which silently no-ops when the code is bogus
  // or targets a different order kind. The original price is still derived
  // from SERVICES so a client can't tamper with the base amount via the form.
  const basePrice = service.variants[variantIdx].priceCents;
  const { amountCents, applied: promo } = await applyPromo(
    basePrice,
    promoCode,
    "booking",
  );

  // Mollie's effective minimum is around €0.50 after fees — anything lower
  // makes no business sense and may even fail at the API. Reject early.
  if (amountCents < 50) {
    return { ok: false, message: "invalid-amount" };
  }

  if (!hasMollieConfig() || !hasSupabaseConfig()) {
    console.warn(
      "[booking-actions] Mollie or Supabase not configured — payments disabled",
    );
    return { ok: false, message: "payments-disabled" };
  }

  let checkoutUrl: string | null = null;

  try {
    const order = await createOrder({
      kind: "booking",
      amount_cents: amountCents,
      currency: "EUR",
      customer_email: email,
      customer_name: name || null,
      customer_phone: phone || null,
      locale: lang,
      service_slug: serviceSlug,
      booking_slug: `${service.bookingSlug}-${audience}`,
      audience,
      variant_idx: variantIdx,
    });
    if (!order) {
      return { ok: false, message: "internal-error" };
    }

    // Sign the orderId so the return page can verify the visitor came from a
    // legitimate Mollie redirect — not someone enumerating `?orderId=…`.
    // In dev without ORDER_TOKEN_SECRET, fall back to no token (return page
    // will then notFound, which is acceptable for local dev).
    let returnToken = "";
    try {
      returnToken = `&t=${signOrderToken(order.id)}`;
    } catch {
      returnToken = "";
    }

    const mollie = getMollieClient();
    const payment = await mollie.payments.create({
      amount: { value: centsToEuroString(amountCents), currency: "EUR" },
      description: `Majorille Garden – ${service.name.nl} (${audience})${promo ? ` – ${promo.code}` : ""}`,
      redirectUrl: `${siteUrl()}/${lang}/booking/return?orderId=${order.id}${returnToken}`,
      webhookUrl: `${siteUrl()}/api/mollie/webhook`,
      metadata: { orderId: order.id, kind: "booking" },
      // The Mollie API uses this to deduplicate retries — if the action is
      // accidentally re-submitted with the same FormData, we get one payment.
      idempotencyKey: order.id,
    });

    checkoutUrl =
      payment.getCheckoutUrl() ?? payment._links?.checkout?.href ?? null;

    await updateOrder(order.id, {
      mollie_payment_id: payment.id,
      checkout_url: checkoutUrl,
      status: "pending",
    });
  } catch (err) {
    console.error("[booking-actions] createBookingPayment failed", err);
    return { ok: false, message: "internal-error" };
  }

  if (!checkoutUrl) {
    // Mollie returned a payment without a checkout link — bail rather than
    // strand the user on a blank page.
    return { ok: false, message: "internal-error" };
  }

  // `redirect()` throws internally — must live outside the try/catch above.
  redirect(checkoutUrl);
}

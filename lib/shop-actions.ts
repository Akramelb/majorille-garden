"use server";

import { redirect } from "next/navigation";

import { PRODUCTS } from "@/lib/content";
import {
  centsToEuroString,
  getMollieClient,
  hasMollieConfig,
  siteUrl,
} from "@/lib/mollie";
import {
  createOrder,
  updateOrder,
  type OrderLineItem,
  type ShippingAddress,
} from "@/lib/orders";
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

function clampQty(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > 5) return 5;
  return parsed;
}

/**
 * Server Action: create a Mollie payment for a single product in the shop.
 *
 * The form posts the product slug and quantity — pricing is re-derived from
 * PRODUCTS server-side so the client cannot tamper with the amount. NL-only
 * shipping for v1; non-NL countries are rejected before any side effects.
 *
 * On success this calls `redirect()` to Mollie's hosted checkout — Next will
 * throw `NEXT_REDIRECT` which is not caught by the try/catch below.
 */
export async function createShopPayment(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  try {
    const slug = String(fd.get("slug") ?? "").trim();
    const qty = clampQty(String(fd.get("qty") ?? "1"));
    const email = String(fd.get("email") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const langRaw = String(fd.get("lang") ?? "nl");
    const lang: "nl" | "en" = langRaw === "en" ? "en" : "nl";
    const promoCode = String(fd.get("promoCode") ?? "").trim() || null;

    const addressLine1 = String(fd.get("address_line1") ?? "").trim();
    const addressLine2 = String(fd.get("address_line2") ?? "").trim();
    const postalCode = String(fd.get("postal_code") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const country = (String(fd.get("country") ?? "NL").trim() || "NL").toUpperCase();

    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      return { ok: false, message: "invalid-product" };
    }

    if (!email || !isEmail(email)) {
      return { ok: false, message: "invalid-email" };
    }
    if (!name) {
      return { ok: false, message: "missing-fields" };
    }
    if (!addressLine1 || !postalCode || !city) {
      return { ok: false, message: "missing-address" };
    }
    if (country !== "NL") {
      return { ok: false, message: "nl-only" };
    }

    if (
      tooLong(email, 200) ||
      tooLong(name, 120) ||
      tooLong(phone, 40) ||
      tooLong(addressLine1, 200) ||
      tooLong(addressLine2, 200) ||
      tooLong(postalCode, 16) ||
      tooLong(city, 120)
    ) {
      return { ok: false, message: "too-long" };
    }

    const rl = await checkRateLimit("payment");
    if (!rl.ok) return { ok: false, message: "rate-limited" };

    if (!hasMollieConfig() || !hasSupabaseConfig()) {
      return { ok: false, message: "payments-disabled" };
    }

    // Re-derive amount from PRODUCTS — never trust the form. Charge priceCents
    // (the sale price); compareAtCents is display-only. Then layer the promo
    // discount on top — `applyPromo` no-ops if the code is wrong or targets a
    // booking (so a customer can't paste BOEK10 here to cheat).
    const basePrice = product.priceCents * qty;
    const { amountCents: amount_cents, applied: promo } = await applyPromo(
      basePrice,
      promoCode,
      "product",
    );

    const line_items: OrderLineItem[] = [
      {
        slug: product.slug,
        qty,
        unit_cents: product.priceCents,
        name_nl: product.name.nl,
        name_en: product.name.en,
      },
    ];

    const shipping_address: ShippingAddress = {
      line1: addressLine1,
      line2: addressLine2 || null,
      postal_code: postalCode,
      city,
      country: "NL",
    };

    const order = await createOrder({
      kind: "product",
      amount_cents,
      currency: "EUR",
      customer_email: email,
      customer_name: name,
      customer_phone: phone || null,
      locale: lang,
      line_items,
      shipping_address,
    });
    if (!order) {
      return { ok: false, message: "internal-error" };
    }

    // Sign the orderId so the return page can verify the visitor came from a
    // legitimate Mollie redirect (see lib/order-token.ts). Dev fallback: empty.
    let returnToken = "";
    try {
      returnToken = `&t=${signOrderToken(order.id)}`;
    } catch {
      returnToken = "";
    }

    const mollie = getMollieClient();
    const description = `Majorille Garden – ${product.name.nl}${qty > 1 ? ` × ${qty}` : ""}${promo ? ` – ${promo.code}` : ""}`;
    const payment = await mollie.payments.create({
      amount: { value: centsToEuroString(amount_cents), currency: "EUR" },
      description,
      redirectUrl: `${siteUrl()}/${lang}/shop/return?orderId=${order.id}${returnToken}`,
      webhookUrl: `${siteUrl()}/api/mollie/webhook`,
      metadata: { orderId: order.id, kind: "product" },
    });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      console.error("[shop] Mollie payment created without checkout URL", payment.id);
      return { ok: false, message: "internal-error" };
    }

    await updateOrder(order.id, {
      mollie_payment_id: payment.id,
      checkout_url: checkoutUrl,
      status: "pending",
    });

    redirect(checkoutUrl);
  } catch (err) {
    // next/navigation's redirect() throws a special NEXT_REDIRECT error that
    // must propagate — don't swallow it.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error(err);
    return { ok: false, message: "internal-error" };
  }
}

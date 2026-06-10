import "server-only";

import type { Order } from "./orders";
import { centsToEuroString, siteUrl } from "./mollie";
import { signOrderToken } from "./order-token";
import { logEmail, type EmailLogKind } from "./email-log";
import { SERVICES, SITE, localized } from "./content";

const RESEND_API = "https://api.resend.com/emails";

export function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_TO);
}

/** Resend is configured for arbitrary recipient sends (no NOTIFY_TO required). */
function hasResendSendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendOpts = {
  subject: string;
  html: string;
  replyTo?: string;
  // Optional audit-log context — passed through to email_log so the
  // /admin/inbox feed can correlate this send back to its order.
  relatedOrderId?: string | null;
  relatedKind?: string | null;
};

type SendCustomerOpts = {
  to: string;
  subject: string;
  html: string;
  // If the customer hits Reply on a noreply@ send, route it to a real inbox
  // (typically SITE.email so the parents see it). Defaults to no reply_to.
  replyTo?: string;
  // Allow the caller to override the email_log kind for sends that aren't
  // a generic "order confirmation" (e.g. the post-payment booking-link CTA).
  logKind?: EmailLogKind;
  relatedOrderId?: string | null;
  relatedKind?: string | null;
};

/** Best-effort extraction of Resend's returned email id from a 2xx body. */
function extractResendId(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { id?: unknown };
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

export async function sendOwnerEmail(opts: SendOpts): Promise<void> {
  if (!hasResendConfig()) {
    console.warn("[email] Resend not configured; skipping notification");
    void logEmail({
      kind: "owner_notification",
      recipient: process.env.NOTIFY_TO ?? "",
      subject: opts.subject,
      status: "skipped",
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
    return;
  }
  const from = process.env.NOTIFY_FROM ?? "Majorille Garden <noreply@majorillegarden.nl>";
  // NOTIFY_TO supports a comma-separated list — e.g. "owner@majorille.nl,akram@example.com"
  const to = process.env
    .NOTIFY_TO!.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const recipient = to.join(",");
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error("[email] Resend error", res.status, body);
      void logEmail({
        kind: "owner_notification",
        recipient,
        subject: opts.subject,
        status: "failed",
        error: `${res.status} ${body}`.slice(0, 1000),
        related_order_id: opts.relatedOrderId ?? null,
        related_kind: opts.relatedKind ?? null,
      });
      return;
    }
    void logEmail({
      kind: "owner_notification",
      recipient,
      subject: opts.subject,
      status: "sent",
      resend_id: extractResendId(body),
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
  } catch (err) {
    console.error("[email] send failed", err);
    void logEmail({
      kind: "owner_notification",
      recipient,
      subject: opts.subject,
      status: "failed",
      error: String(err).slice(0, 1000),
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
  }
}

/**
 * Send to an arbitrary recipient (e.g. an order confirmation to the customer).
 * Fire-and-forget — silently no-ops if RESEND_API_KEY is unset.
 */
export async function sendCustomerEmail(opts: SendCustomerOpts): Promise<void> {
  const logKind: EmailLogKind = opts.logKind ?? "customer_order_confirmation";
  if (!hasResendSendConfig()) {
    console.warn("[email] Resend not configured; skipping customer email");
    void logEmail({
      kind: logKind,
      recipient: opts.to,
      subject: opts.subject,
      status: "skipped",
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
    return;
  }
  const from =
    process.env.NOTIFY_FROM ?? "Majorille Garden <noreply@majorillegarden.nl>";
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error("[email] Resend customer-send error", res.status, body);
      void logEmail({
        kind: logKind,
        recipient: opts.to,
        subject: opts.subject,
        status: "failed",
        error: `${res.status} ${body}`.slice(0, 1000),
        related_order_id: opts.relatedOrderId ?? null,
        related_kind: opts.relatedKind ?? null,
      });
      return;
    }
    void logEmail({
      kind: logKind,
      recipient: opts.to,
      subject: opts.subject,
      status: "sent",
      resend_id: extractResendId(body),
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
  } catch (err) {
    console.error("[email] customer send failed", err);
    void logEmail({
      kind: logKind,
      recipient: opts.to,
      subject: opts.subject,
      status: "failed",
      error: String(err).slice(0, 1000),
      related_order_id: opts.relatedOrderId ?? null,
      related_kind: opts.relatedKind ?? null,
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEuro(cents: number): string {
  return `€ ${centsToEuroString(cents)}`;
}

/**
 * Shared inline styles. Inline-only (no <style> block) for Gmail/Outlook
 * compatibility; block layout — no flex, no grid. 600px max width, 14px+
 * fonts, terracotta (#A0522D) accent on cream/parchment background.
 */
const WRAPPER_STYLE =
  "font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#2A1810;background:#FFFBF3;line-height:1.6;font-size:15px";
const ACCENT_BAR =
  '<div style="height:3px;background:#A0522D;margin:0 0 20px;width:60px"></div>';
const FOOTER_RULE =
  '<hr style="border:none;border-top:1px solid #E0D3B8;margin:24px 0 16px"/>';

function siteContactBlock(lang: "nl" | "en"): string {
  const label = lang === "nl" ? "Vragen?" : "Questions?";
  const reach =
    lang === "nl"
      ? "Bereik ons gerust via"
      : "Reach us any time at";
  return `
    <p style="color:#6B5A4B;font-size:13px;margin:0 0 4px">${escapeHtml(label)}</p>
    <p style="color:#6B5A4B;font-size:13px;margin:0">${escapeHtml(reach)}
      <a href="mailto:${escapeHtml(SITE.email)}" style="color:#A0522D;text-decoration:none">${escapeHtml(SITE.email)}</a>
      &middot;
      <a href="${escapeHtml(SITE.phoneLink)}" style="color:#A0522D;text-decoration:none">${escapeHtml(SITE.phone)}</a>
    </p>
  `;
}

function signOff(lang: "nl" | "en"): string {
  const line =
    lang === "nl"
      ? "Met dank,<br/>Fati &amp; Thami"
      : "With gratitude,<br/>Fati &amp; Thami";
  return `<p style="margin:20px 0 0">${line}</p>`;
}

export function contactNotificationHtml(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): string {
  return `
    <div style="${WRAPPER_STYLE}">
      ${ACCENT_BAR}
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px;font-size:20px">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6B5A4B;width:120px">Name</td><td>${escapeHtml(input.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B5A4B">Email</td><td><a href="mailto:${escapeHtml(input.email)}" style="color:#A0522D;text-decoration:none">${escapeHtml(input.email)}</a></td></tr>
        ${input.phone ? `<tr><td style="padding:6px 0;color:#6B5A4B">Phone</td><td><a href="tel:${escapeHtml(input.phone.replace(/\s+/g, ""))}" style="color:#A0522D;text-decoration:none">${escapeHtml(input.phone)}</a></td></tr>` : ""}
      </table>
      <hr style="border:none;border-top:1px solid #E0D3B8;margin:20px 0"/>
      <p style="white-space:pre-wrap;line-height:1.6;margin:0">${escapeHtml(input.message)}</p>
    </div>
  `;
}

/**
 * Customer-side ack after the contact form is submitted. Warm, short, NL/EN.
 * Sent with reply_to: SITE.email so a Reply hits the parents' inbox.
 */
export function contactAckHtml(input: {
  name: string;
  lang: "nl" | "en";
  message: string;
}): string {
  const { name, lang, message } = input;
  const greeting =
    lang === "nl" ? `Dag ${name},` : `Hi ${name},`;
  const body =
    lang === "nl"
      ? "Bedankt voor je bericht — we hebben het goed ontvangen. We nemen binnen 24 uur persoonlijk contact met je op."
      : "Thank you for reaching out — we've received your message and will get back to you personally within 24 hours.";
  const yourMessageLabel =
    lang === "nl" ? "Jouw bericht" : "Your message";
  return `
    <div style="${WRAPPER_STYLE}">
      ${ACCENT_BAR}
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px;font-size:22px">Majorille Garden</h2>
      <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px">${escapeHtml(body)}</p>
      <p style="color:#6B5A4B;font-size:13px;margin:20px 0 6px">${escapeHtml(yourMessageLabel)}</p>
      <blockquote style="margin:0;padding:12px 14px;background:#F4E9D4;border-left:2px solid #A0522D;color:#2A1810;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(message)}</blockquote>
      ${signOff(lang)}
      ${FOOTER_RULE}
      ${siteContactBlock(lang)}
    </div>
  `;
}

/**
 * Customer-side ack after a review submission. Tiny — just warmth + a heads-up
 * that we moderate before publishing. Logkind "other".
 */
export function reviewAckHtml(input: {
  name: string;
  lang: "nl" | "en";
}): string {
  const { name, lang } = input;
  const greeting = lang === "nl" ? `Dag ${name},` : `Hi ${name},`;
  const body =
    lang === "nl"
      ? "Heel fijn dat je de tijd nam om je ervaring met ons te delen. We lezen je review aandachtig en plaatsen hem na goedkeuring op de site."
      : "Thank you for taking the time to share your experience. We read every review with care and publish it on the site after a short review.";
  return `
    <div style="${WRAPPER_STYLE}">
      ${ACCENT_BAR}
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px;font-size:22px">Majorille Garden</h2>
      <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px">${escapeHtml(body)}</p>
      ${signOff(lang)}
      ${FOOTER_RULE}
      ${siteContactBlock(lang)}
    </div>
  `;
}

/**
 * Resolve a service slug + variant index to human-readable NL/EN names so the
 * owner email shows "Traditionele Massage — Volledige sessie (60 min)" instead
 * of the raw `traditionele-massage` slug + `variant_idx=1`.
 */
function resolveServiceDisplay(
  slug: string | null,
  variantIdx: number | null,
): { nameNl: string; nameEn: string; variantNl: string | null; variantEn: string | null } {
  if (!slug) return { nameNl: "—", nameEn: "—", variantNl: null, variantEn: null };
  const svc = SERVICES.find((s) => s.slug === slug);
  if (!svc) {
    return { nameNl: slug, nameEn: slug, variantNl: null, variantEn: null };
  }
  let variantNl: string | null = null;
  let variantEn: string | null = null;
  if (variantIdx !== null && svc.variants[variantIdx]) {
    const v = svc.variants[variantIdx];
    variantNl = `${localized(v.label, "nl")} (${v.durationMin} min)`;
    variantEn = `${localized(v.label, "en")} (${v.durationMin} min)`;
  }
  return {
    nameNl: localized(svc.name, "nl"),
    nameEn: localized(svc.name, "en"),
    variantNl,
    variantEn,
  };
}

function formatShippingAddress(addr: NonNullable<Order["shipping_address"]>): string {
  const parts: string[] = [];
  if (addr.name) parts.push(escapeHtml(String(addr.name)));
  if (addr.line1) parts.push(escapeHtml(String(addr.line1)));
  if (addr.line2) parts.push(escapeHtml(String(addr.line2)));
  const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(" ");
  if (cityLine) parts.push(escapeHtml(cityLine));
  if (addr.country) parts.push(escapeHtml(String(addr.country)));
  return parts.join("<br/>");
}

/** Owner notification HTML for a new order (booking or product). */
export function orderOwnerHtml(order: Order): string {
  const adminLink = `${siteUrl()}/admin/orders`;
  const shortRef = order.id.slice(0, 8);
  const kindLabel = order.kind === "booking" ? "Booking" : "Product order";
  const display = resolveServiceDisplay(order.service_slug, order.variant_idx);

  const detailRows: string[] = [
    `<tr><td style="padding:6px 0;color:#6B5A4B;width:140px">Kind</td><td>${escapeHtml(kindLabel)}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#6B5A4B">Reference</td><td>#${escapeHtml(shortRef)}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#6B5A4B">Amount</td><td><strong>${escapeHtml(formatEuro(order.amount_cents))}</strong> ${escapeHtml(order.currency)}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#6B5A4B">Customer</td><td>${escapeHtml(order.customer_name ?? "—")}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#6B5A4B">Email</td><td><a href="mailto:${escapeHtml(order.customer_email)}" style="color:#A0522D;text-decoration:none">${escapeHtml(order.customer_email)}</a></td></tr>`,
  ];
  if (order.customer_phone) {
    detailRows.push(
      `<tr><td style="padding:6px 0;color:#6B5A4B">Phone</td><td><a href="tel:${escapeHtml(order.customer_phone.replace(/\s+/g, ""))}" style="color:#A0522D;text-decoration:none">${escapeHtml(order.customer_phone)}</a></td></tr>`,
    );
  }
  if (order.mollie_payment_id) {
    detailRows.push(
      `<tr><td style="padding:6px 0;color:#6B5A4B">Mollie ID</td><td>${escapeHtml(order.mollie_payment_id)}</td></tr>`,
    );
  }

  let kindSpecific = "";
  if (order.kind === "booking") {
    const bookingRows: string[] = [];
    bookingRows.push(
      `<tr><td style="padding:6px 0;color:#6B5A4B;width:140px">Service</td><td>${escapeHtml(display.nameNl)}</td></tr>`,
    );
    if (order.audience) {
      const audienceLabel = order.audience === "women" ? "Women" : "Men";
      bookingRows.push(
        `<tr><td style="padding:6px 0;color:#6B5A4B">Audience</td><td>${escapeHtml(audienceLabel)}</td></tr>`,
      );
    }
    if (display.variantNl) {
      bookingRows.push(
        `<tr><td style="padding:6px 0;color:#6B5A4B">Variant</td><td>${escapeHtml(display.variantNl)}</td></tr>`,
      );
    }
    kindSpecific = `
      <h3 style="font-family:Georgia,serif;color:#2A1810;margin:20px 0 8px;font-size:16px">Booking details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${bookingRows.join("")}</table>
    `;
  } else if (order.kind === "product" && order.line_items && order.line_items.length) {
    const rows = order.line_items
      .map(
        (li) => `
          <tr>
            <td style="padding:6px 8px 6px 0">${escapeHtml(li.name_nl)} <span style="color:#6B5A4B">(${escapeHtml(li.slug)})</span></td>
            <td style="padding:6px 8px;text-align:center">${li.qty}</td>
            <td style="padding:6px 8px;text-align:right">${escapeHtml(formatEuro(li.unit_cents))}</td>
            <td style="padding:6px 0;text-align:right">${escapeHtml(formatEuro(li.unit_cents * li.qty))}</td>
          </tr>
        `,
      )
      .join("");
    kindSpecific = `
      <h3 style="font-family:Georgia,serif;color:#2A1810;margin:20px 0 8px;font-size:16px">Line items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="color:#6B5A4B;text-align:left">
            <th style="padding:6px 8px 6px 0;font-weight:normal">Item</th>
            <th style="padding:6px 8px;font-weight:normal;text-align:center">Qty</th>
            <th style="padding:6px 8px;font-weight:normal;text-align:right">Unit</th>
            <th style="padding:6px 0;font-weight:normal;text-align:right">Line total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    if (order.shipping_address) {
      kindSpecific += `
        <h3 style="font-family:Georgia,serif;color:#2A1810;margin:20px 0 8px;font-size:16px">Shipping address</h3>
        <p style="margin:0;font-size:14px;line-height:1.6">${formatShippingAddress(order.shipping_address)}</p>
      `;
    }
  }

  return `
    <div style="${WRAPPER_STYLE}">
      ${ACCENT_BAR}
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 4px;font-size:20px">New ${escapeHtml(kindLabel.toLowerCase())} &middot; #${escapeHtml(shortRef)}</h2>
      <p style="color:#6B5A4B;font-size:13px;margin:0 0 16px">Paid via Mollie</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${detailRows.join("")}</table>
      ${kindSpecific}
      <hr style="border:none;border-top:1px solid #E0D3B8;margin:24px 0 16px"/>
      <p style="font-size:14px;line-height:1.6;margin:0">
        <a href="${adminLink}" style="color:#A0522D;text-decoration:none;font-weight:600">Open in admin &rarr;</a>
      </p>
    </div>
  `;
}

/** Customer-facing order confirmation HTML. Branded, warm, bilingual-aware. */
export function orderCustomerHtml(order: Order, lang: "nl" | "en"): string {
  const shortRef = order.id.slice(0, 8);
  const firstName = (order.customer_name ?? "").trim().split(/\s+/)[0] ?? "";
  const greeting = firstName
    ? lang === "nl"
      ? `Dag ${firstName},`
      : `Hi ${firstName},`
    : lang === "nl"
      ? "Dag,"
      : "Hi there,";

  if (order.kind === "booking") {
    // Append signed token so the CTA in the email passes the verifyOrderToken
    // check on the return page. If ORDER_TOKEN_SECRET is unset (dev), omit.
    let tokenQs = "";
    try {
      tokenQs = `&t=${signOrderToken(order.id)}`;
    } catch {
      tokenQs = "";
    }
    const ctaHref = `${siteUrl()}/${lang}/booking/return?orderId=${order.id}${tokenQs}`;
    const display = resolveServiceDisplay(order.service_slug, order.variant_idx);
    const serviceName = lang === "nl" ? display.nameNl : display.nameEn;
    const variantText = lang === "nl" ? display.variantNl : display.variantEn;
    const intro =
      lang === "nl"
        ? "Bedankt voor je betaling — je behandeling is voor je gereserveerd. Nu nog één laatste stapje: kies hieronder een moment dat jou past."
        : "Thank you for your payment — your treatment is reserved. One final step: pick a time below that suits you.";
    const cta =
      lang === "nl"
        ? "Kies je moment"
        : "Pick your time";
    const ctaHint =
      lang === "nl"
        ? "Geen zorgen als je de knop later opent — deze link blijft geldig."
        : "No rush — this link stays valid if you'd like to come back to it later.";
    const summaryHeading =
      lang === "nl" ? "Je reservering" : "Your reservation";
    const refLabel = lang === "nl" ? "Referentie" : "Reference";
    const paidLabel = lang === "nl" ? "Betaald" : "Paid";
    const treatmentLabel = lang === "nl" ? "Behandeling" : "Treatment";

    const summaryRows: string[] = [];
    if (serviceName && serviceName !== "—") {
      summaryRows.push(
        `<tr><td style="padding:4px 0;color:#6B5A4B;width:130px">${escapeHtml(treatmentLabel)}</td><td>${escapeHtml(serviceName)}</td></tr>`,
      );
    }
    if (variantText) {
      const variantLabel = lang === "nl" ? "Duur" : "Duration";
      summaryRows.push(
        `<tr><td style="padding:4px 0;color:#6B5A4B">${escapeHtml(variantLabel)}</td><td>${escapeHtml(variantText)}</td></tr>`,
      );
    }
    summaryRows.push(
      `<tr><td style="padding:4px 0;color:#6B5A4B">${escapeHtml(paidLabel)}</td><td>${escapeHtml(formatEuro(order.amount_cents))}</td></tr>`,
    );
    summaryRows.push(
      `<tr><td style="padding:4px 0;color:#6B5A4B">${escapeHtml(refLabel)}</td><td>#${escapeHtml(shortRef)}</td></tr>`,
    );

    return `
      <div style="${WRAPPER_STYLE}">
        ${ACCENT_BAR}
        <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px;font-size:22px">Majorille Garden</h2>
        <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          ${summaryRows.join("")}
        </table>
        <p style="margin:24px 0 8px">
          <a href="${ctaHref}" style="display:inline-block;background:#A0522D;color:#FFFBF3;padding:14px 24px;border-radius:4px;text-decoration:none;font-weight:600;font-size:15px">${escapeHtml(cta)}</a>
        </p>
        <p style="color:#6B5A4B;font-size:13px;margin:0 0 4px">${escapeHtml(ctaHint)}</p>
        <h3 style="font-family:Georgia,serif;color:#2A1810;margin:24px 0 8px;font-size:15px">${escapeHtml(summaryHeading)}</h3>
        ${signOff(lang)}
        ${FOOTER_RULE}
        ${siteContactBlock(lang)}
      </div>
    `;
  }

  // ---------- Product order ----------
  const intro =
    lang === "nl"
      ? "Bedankt voor je bestelling — we hebben je betaling ontvangen en pakken je pakketje met zorg in."
      : "Thank you for your order — we've received your payment and are carefully preparing your package.";
  const shippingHeading =
    lang === "nl" ? "Verzending" : "Shipping";
  const shippingBody =
    lang === "nl"
      ? "We versturen binnen Nederland en je bestelling is doorgaans binnen 2–4 werkdagen bij je."
      : "We ship within the Netherlands; your order typically arrives in 2–4 business days.";
  const heading = lang === "nl" ? "Je bestelling" : "Your order";
  const refLabel = lang === "nl" ? "Referentie" : "Reference";
  const totalLabel = lang === "nl" ? "Totaal" : "Total";
  const shipToHeading =
    lang === "nl" ? "Verzonden naar" : "Shipping to";

  const lineRows = (order.line_items ?? [])
    .map((li) => {
      const name = lang === "nl" ? li.name_nl : li.name_en;
      return `
        <tr>
          <td style="padding:8px 8px 8px 0;vertical-align:top">${escapeHtml(name)}</td>
          <td style="padding:8px;text-align:center;vertical-align:top;color:#6B5A4B">&times;${li.qty}</td>
          <td style="padding:8px 0;text-align:right;vertical-align:top">${escapeHtml(formatEuro(li.unit_cents * li.qty))}</td>
        </tr>
      `;
    })
    .join("");

  const shippingAddrBlock = order.shipping_address
    ? `
        <h3 style="font-family:Georgia,serif;color:#2A1810;margin:24px 0 8px;font-size:15px">${escapeHtml(shipToHeading)}</h3>
        <p style="margin:0;font-size:14px;line-height:1.6">${formatShippingAddress(order.shipping_address)}</p>
      `
    : "";

  return `
    <div style="${WRAPPER_STYLE}">
      ${ACCENT_BAR}
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px;font-size:22px">Majorille Garden</h2>
      <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
      <h3 style="font-family:Georgia,serif;color:#2A1810;margin:20px 0 8px;font-size:16px">${escapeHtml(heading)} &middot; #${escapeHtml(shortRef)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${lineRows}
        <tr><td colspan="3" style="border-top:1px solid #E0D3B8;padding-top:8px"></td></tr>
        <tr>
          <td colspan="2" style="padding:8px 0;color:#6B5A4B">${escapeHtml(totalLabel)}</td>
          <td style="padding:8px 0;text-align:right;font-weight:600">${escapeHtml(formatEuro(order.amount_cents))}</td>
        </tr>
      </table>
      <h3 style="font-family:Georgia,serif;color:#2A1810;margin:24px 0 6px;font-size:15px">${escapeHtml(shippingHeading)}</h3>
      <p style="margin:0;color:#2A1810">${escapeHtml(shippingBody)}</p>
      ${shippingAddrBlock}
      <p style="color:#6B5A4B;font-size:13px;margin-top:20px">${escapeHtml(refLabel)}: #${escapeHtml(shortRef)}</p>
      ${signOff(lang)}
      ${FOOTER_RULE}
      ${siteContactBlock(lang)}
    </div>
  `;
}

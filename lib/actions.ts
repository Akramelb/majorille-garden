"use server";

import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";
import {
  contactAckHtml,
  contactNotificationHtml,
  reviewAckHtml,
  sendCustomerEmail,
  sendOwnerEmail,
} from "./email";
import { SITE } from "./content";
import { checkRateLimit } from "./ratelimit";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Per-field length cap. Stops oversize values from sneaking through even when
 * the overall request stays under the 100kb body-size limit configured in
 * next.config.ts. Returns true when the value exceeds `max` characters.
 */
function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

/**
 * Mask an email for log output — keeps domain + first/last local-part char,
 * stars out the middle. Use in `console.warn` payloads so we never persist
 * full PII to platform logs. Local to this file because "use server" exports
 * must all be async; `lib/orders.ts` carries its own copy.
 */
function maskEmail(e: string): string {
  if (!e || !e.includes("@")) return "<no-email>";
  const [user, domain] = e.split("@");
  const u =
    user.length <= 2
      ? user[0] + "*"
      : user[0] + "*".repeat(user.length - 2) + user[user.length - 1];
  return `${u}@${domain}`;
}

export async function submitReview(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const author = String(formData.get("author_name") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  const body = String(formData.get("body") ?? "").trim();
  const serviceSlug = String(formData.get("service_slug") ?? "").trim() || null;
  const locale = String(formData.get("locale") ?? "nl");
  // Optional — only used to send the "thanks, we'll review and publish" ack.
  // Not persisted to the reviews table (no column for it today, no schema
  // change requested). If the customer provides it, they get a confirmation.
  const authorEmail = String(formData.get("author_email") ?? "").trim();
  const honeypot = String(formData.get("hp") ?? "");
  if (honeypot) return { ok: true, message: "ok" };
  if (!author || !body || rating < 1 || rating > 5) {
    return { ok: false, message: "missing-fields" };
  }
  if (tooLong(author, 120) || tooLong(body, 2000)) {
    return { ok: false, message: "too-long" };
  }
  if (authorEmail && (!isEmail(authorEmail) || tooLong(authorEmail, 200))) {
    return { ok: false, message: "invalid-email" };
  }
  const rl = await checkRateLimit("review");
  if (!rl.ok) return { ok: false, message: "rate-limited" };
  if (!hasSupabaseConfig()) {
    console.warn("[review] Supabase not configured — submission discarded", {
      rating,
    });
    return { ok: true, message: "logged" };
  }
  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("reviews").insert({
    author_name: author,
    rating,
    body,
    service_slug: serviceSlug,
    locale,
    status: "pending",
  });
  if (error) {
    console.error("[review] insert failed", error);
    return { ok: false, message: "supabase-failed" };
  }
  // Fire-and-forget customer ack when an email was supplied. Reply lands in
  // the parents' inbox via reply_to: SITE.email.
  if (authorEmail) {
    const lang: "nl" | "en" = locale === "en" ? "en" : "nl";
    void sendCustomerEmail({
      to: authorEmail,
      subject:
        lang === "nl"
          ? "Bedankt voor je review — Majorille Garden"
          : "Thanks for your review — Majorille Garden",
      html: reviewAckHtml({ name: author, lang }),
      replyTo: SITE.email,
      logKind: "other",
    });
  }
  return { ok: true, message: "submitted" };
}

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("hp") ?? "");
  if (honeypot) return { ok: true, message: "ok" }; // silently drop bot
  if (!name || !email || !message) {
    return { ok: false, message: "missing-fields" };
  }
  if (!isEmail(email)) {
    return { ok: false, message: "invalid-email" };
  }
  if (
    tooLong(name, 120) ||
    tooLong(email, 200) ||
    tooLong(phone, 40) ||
    tooLong(message, 4000)
  ) {
    return { ok: false, message: "too-long" };
  }
  const rl = await checkRateLimit("contact");
  if (!rl.ok) return { ok: false, message: "rate-limited" };
  // Owner notification — fire-and-forget (no-op without RESEND_API_KEY + NOTIFY_TO).
  // replyTo set so Reply in the parents' inbox goes straight to the customer.
  void sendOwnerEmail({
    // CR/LF stripped: user input never gets to smuggle extra headers or
    // mangle the subject, whatever the mail transport does downstream.
    subject: `Contact: ${name.replace(/[\r\n]+/g, " ")}`,
    html: contactNotificationHtml({ name, email, phone, message }),
    replyTo: email,
  });
  // Customer-side ack — short, warm, NL/EN. Reply lands in parents' inbox
  // via reply_to: SITE.email. logKind: "other" — matches the email_log
  // check constraint without needing a schema change.
  {
    const langHeader = String(formData.get("locale") ?? "nl");
    const ackLang: "nl" | "en" = langHeader === "en" ? "en" : "nl";
    void sendCustomerEmail({
      to: email,
      subject:
        ackLang === "nl"
          ? "We hebben je bericht ontvangen — Majorille Garden"
          : "We've received your message — Majorille Garden",
      html: contactAckHtml({ name, lang: ackLang, message }),
      replyTo: SITE.email,
      logKind: "other",
    });
  }

  if (!hasSupabaseConfig()) {
    console.warn(
      "[contact] Supabase not configured — submission discarded",
      { email: maskEmail(email) },
    );
    return { ok: true, message: "logged" };
  }
  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("contact_submissions").insert({
    name,
    email,
    phone: phone || null,
    message,
  });
  if (error) {
    console.error("[contact] supabase insert failed", error);
    return { ok: false, message: "supabase-failed" };
  }
  return { ok: true, message: "saved" };
}

export async function subscribeNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) return { ok: false, message: "invalid-email" };
  if (tooLong(email, 200)) return { ok: false, message: "too-long" };
  const rl = await checkRateLimit("newsletter");
  if (!rl.ok) return { ok: false, message: "rate-limited" };
  if (!hasSupabaseConfig()) {
    console.warn(
      "[newsletter] Supabase not configured — email discarded",
      { email: maskEmail(email) },
    );
    return { ok: true, message: "logged" };
  }
  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("newsletter_subscribers")
    .insert({ email })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return { ok: true, message: "already-subscribed" };
    }
    console.error("[newsletter] supabase insert failed", error);
    return { ok: false, message: "supabase-failed" };
  }
  return { ok: true, message: "subscribed" };
}

"use server";

import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";
import { contactNotificationHtml, sendOwnerEmail } from "./email";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const honeypot = String(formData.get("hp") ?? "");
  if (honeypot) return { ok: true, message: "ok" };
  if (!author || !body || rating < 1 || rating > 5) {
    return { ok: false, message: "missing-fields" };
  }
  if (!hasSupabaseConfig()) {
    console.warn("[review] Supabase not configured — discarded:", {
      author,
      rating,
      body,
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
  // Fire-and-forget email notification (no-op without RESEND_API_KEY + NOTIFY_TO)
  void sendOwnerEmail({
    subject: `Contact: ${name}`,
    html: contactNotificationHtml({ name, email, phone, message }),
    replyTo: email,
  });

  if (!hasSupabaseConfig()) {
    console.warn(
      "[contact] Supabase not configured — submission discarded:",
      { name, email, phone, message },
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
  if (!hasSupabaseConfig()) {
    console.warn(
      "[newsletter] Supabase not configured — email discarded:",
      email,
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

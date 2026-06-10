"use server";

import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { siteUrl } from "@/lib/seo";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Request a magic-link sign-in. Wrapped as a Server Action so we can rate-limit
 * the Supabase OTP send server-side per IP — calling
 * `supabase.auth.signInWithOtp` directly in the browser has no per-IP gate.
 *
 * Form fields:
 *   - email: string (required)
 *   - next:  string (optional — same-origin path the callback should land on)
 *
 * Returns FormState. On rate-limit / missing config, returns ok: false so the
 * UI can surface a message instead of pretending the email was sent.
 */
export async function requestMagicLink(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "/admin").trim();

  if (!email) return { ok: false, message: "missing-email" };
  if (!isEmail(email)) return { ok: false, message: "invalid-email" };
  if (email.length > 200) return { ok: false, message: "too-long" };

  // Restrict `next` to a same-origin path — mirrors the callback route's guard.
  const next =
    nextRaw &&
    nextRaw.startsWith("/") &&
    !nextRaw.startsWith("//") &&
    !nextRaw.startsWith("/\\") &&
    /^[A-Za-z0-9/_\-?.=&%#]+$/.test(nextRaw)
      ? nextRaw
      : "/admin";

  // Rate-limit intentionally NOT applied here — admin login is gated by
  // ADMIN_EMAILS so abuse of Supabase send quota is bounded to the allowlist.
  // Keeping the OTP request free of throttling means parents debugging a
  // failed click don't hit a 10-minute lockout.

  // Always derive emailRedirectTo from the canonical SITE_URL — NOT from
  // request headers. If a user signs in from a *.vercel.app preview URL, the
  // header-derived path would mail them a link that lands on the preview
  // deploy (where the cookie domain mismatches and the session breaks).
  //
  // CRUCIAL: we pass NO query string. Supabase strict-matches `emailRedirectTo`
  // against the dashboard "Additional Redirect URLs" list — if our URL
  // includes `?next=/admin` and the dashboard entry doesn't, Supabase silently
  // falls back to the Site URL (= homepage), which is the exact symptom of
  // "magic link opens the home page instead of /admin". The callback route
  // already defaults to `/admin` when `?next=` is absent, so dropping it here
  // costs us nothing.
  void next; // intentionally unused — kept in signature for future routing.
  const emailRedirectTo = `${siteUrl()}/auth/callback`;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) {
      console.error("[auth] signInWithOtp failed", error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "sent" };
  } catch (err) {
    console.error("[auth] requestMagicLink failed", err);
    return { ok: false, message: "internal-error" };
  }
}

/**
 * Verify a 6-digit OTP code pasted from the magic-link email. We send both a
 * link AND a code in the email — the code is the resilient path because
 * Gmail/Outlook URL scanners can't "use up" a numeric code the way they can
 * one-shot a link (which is the actual cause of "Token has expired or is
 * invalid" errors users see when clicking the link).
 *
 * Form fields:
 *   - email: string (required, must match the address the OTP was sent to)
 *   - code:  string (required, exactly 6 digits)
 *
 * Supabase's `verifyOtp({ type: "email", email, token })` sets the session
 * cookie via our cookie writer on success. We then return ok so the client
 * can navigate to /admin (or its `next` redirect).
 */
export async function verifyOtpCode(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (!email || !isEmail(email)) return { ok: false, message: "invalid-email" };
  // Supabase OTP length is configurable per project — 6 by default, but older
  // accounts ship with 8. Accept any length in their supported range; Supabase
  // does the actual validity check.
  if (!/^\d{6,10}$/.test(code)) return { ok: false, message: "invalid-code" };

  // Rate-limit intentionally NOT applied (see requestMagicLink comment).
  // Supabase verifyOtp itself rejects exhausted/expired tokens server-side.

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      console.error("[auth] verifyOtp failed", error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "verified" };
  } catch (err) {
    console.error("[auth] verifyOtpCode failed", err);
    return { ok: false, message: "internal-error" };
  }
}

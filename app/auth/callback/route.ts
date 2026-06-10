import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";

// Reject anything that isn't a same-origin path. Protects against open-redirect
// abuse via `?next=https://evil.example/...` or protocol-relative `//evil/...`.
// Acceptable: starts with a single `/`, contains only safe URL chars, doesn't
// start with `//`, `/\`, `http`, `\`, or `javascript:`.
function safeNextPath(raw: string | null): string {
  if (!raw) return "/admin";
  if (raw.length > 512) return "/admin";
  if (!raw.startsWith("/")) return "/admin";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/admin";
  const lower = raw.toLowerCase();
  if (lower.startsWith("http") || lower.startsWith("javascript:")) return "/admin";
  if (!/^[A-Za-z0-9/_\-?.=&%#]+$/.test(raw)) return "/admin";
  return raw;
}

// Handles BOTH Supabase auth callback shapes:
//   - Magic-link / email-OTP:  ?token_hash=...&type=magiclink  → verifyOtp
//   - PKCE / OAuth code:       ?code=...                        → exchangeCodeForSession
// On success, redirects to ?next= (default /admin) — restricted to same-origin paths.
// On failure, redirects to /admin/login with an error code surfaced in the UI.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/admin/login?error=missing-token`);
}

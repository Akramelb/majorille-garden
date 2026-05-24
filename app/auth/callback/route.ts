import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";

// Handles BOTH Supabase auth callback shapes:
//   - Magic-link / email-OTP:  ?token_hash=...&type=magiclink  → verifyOtp
//   - PKCE / OAuth code:       ?code=...                        → exchangeCodeForSession
// On success, redirects to ?next= (default /admin).
// On failure, redirects to /admin/login with an error code surfaced in the UI.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/admin";
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

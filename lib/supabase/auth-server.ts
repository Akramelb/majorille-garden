import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export function hasAdminAuthConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Cookie-based Supabase client for the App Router (Next 16 — cookies() is async). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; the proxy
            // refreshes the session cookie on navigation.
          }
        },
      },
    },
  );
}

function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns the signed-in user IFF they're authenticated AND on the admin
 * allowlist (ADMIN_EMAILS). Otherwise null. If auth isn't configured yet,
 * returns null so the admin gates closed rather than crashing.
 */
export async function getAdminUser(): Promise<User | null> {
  if (!hasAdminAuthConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const allow = adminAllowlist();
  // If no allowlist is set, any authenticated user is allowed (dev convenience).
  if (allow.length && !allow.includes(user.email.toLowerCase())) return null;
  return user;
}

import Link from "next/link";
import { Container } from "@/components/ui/Container";

// Phase 2 placeholder login screen. Wires up to Supabase magic-link auth later.
// To activate:
//   1. Add `@supabase/ssr` and create `lib/supabase-browser.ts`
//   2. Replace the form's action with a `signInWithOtp` server action
//   3. Add a /auth/callback route to exchange the code for a session
//   4. In app/admin/page.tsx, replace the redirect with the actual dashboard

export default function AdminLogin() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <Container size="sm">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-terracotta">
            Majorille Garden
          </p>
          <h1 className="mt-3 serif text-4xl text-deep-brown">Admin</h1>
        </div>

        <div className="bg-cream border border-border/60 p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta mb-4">
            Phase 2 — coming soon
          </p>
          <h2 className="serif text-2xl text-deep-brown mb-3">
            CMS not yet active
          </h2>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Magic-link login via Supabase Auth ships in Phase 2 of this build. For
            now, edit content directly in <code className="bg-sand/40 px-1.5 py-0.5 text-xs">lib/content.ts</code>
            {" "}and redeploy.
          </p>

          <form className="space-y-4 opacity-50 pointer-events-none">
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
                Email
              </span>
              <input
                type="email"
                disabled
                placeholder="you@majorillegarden.nl"
                className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm"
              />
            </label>
            <button
              type="button"
              disabled
              className="btn-primary w-full"
            >
              Send magic link
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs text-muted">
          <Link href="/nl" className="hover:text-deep-brown">
            ← Back to site
          </Link>
        </p>
      </Container>
    </section>
  );
}

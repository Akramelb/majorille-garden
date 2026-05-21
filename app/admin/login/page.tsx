"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

type Status = "idle" | "sending" | "sent" | "error";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const configured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

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
          {!configured ? (
            <p className="text-sm text-muted leading-relaxed">
              Admin login isn&apos;t configured yet. Set{" "}
              <code className="bg-sand/40 px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="bg-sand/40 px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              in the environment.
            </p>
          ) : status === "sent" ? (
            <div>
              <h2 className="serif text-2xl text-deep-brown mb-3">
                Check your email
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                We sent a magic sign-in link to{" "}
                <span className="text-deep-brown">{email}</span>. Open it on this
                device to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <label className="block">
                <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@majorillegarden.nl"
                  className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
                />
              </label>
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary w-full"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
              {status === "error" && (
                <p className="text-terracotta text-sm">{message}</p>
              )}
            </form>
          )}
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

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  // Surface ?error=... arriving back from /auth/callback (so failed magic-link
  // verifications don't silently look like a fresh login screen).
  useEffect(() => {
    const err = searchParams?.get("error");
    if (err) {
      setStatus("error");
      setMessage(
        err === "missing-token"
          ? "De magic link miste een token. Vraag een nieuwe aan."
          : err === "auth"
            ? "De magic link is verlopen of ongeldig. Vraag een nieuwe aan."
            : `Inloggen mislukt: ${decodeURIComponent(err)}`,
      );
    }
  }, [searchParams]);

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

  if (!configured) {
    return (
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
    );
  }

  if (status === "sent") {
    return (
      <div>
        <h2 className="serif text-2xl text-deep-brown mb-3">Check your email</h2>
        <p className="text-muted text-sm leading-relaxed">
          We sent a magic sign-in link to{" "}
          <span className="text-deep-brown">{email}</span>. Open it on this device
          to continue.
        </p>
      </div>
    );
  }

  return (
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
  );
}

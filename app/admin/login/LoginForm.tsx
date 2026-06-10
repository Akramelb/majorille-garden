"use client";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requestMagicLink,
  verifyOtpCode,
  type FormState,
} from "@/lib/auth-actions";

/**
 * Two-step admin login:
 *   1. Submit email → we ask Supabase to send a magic link + a 6-digit code.
 *   2. Receive a code input. User pastes the 6-digit code from the email
 *      (resilient against Gmail/Outlook URL-scanners that consume one-shot
 *      links before the human clicks) OR clicks the link in the mail.
 *
 * The OTP code path runs through `verifyOtpCode` → on success the Supabase
 * cookie is set server-side and we hard-refresh into `/admin` (or the safe
 * `next` redirect carried through from the original URL).
 *
 * Surfaced URL `?error=...` from /auth/callback still shows here so failed
 * link-clicks don't silently look like a fresh login screen.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const nextParam = searchParams?.get("next") ?? "/admin";

  const [sendState, sendAction, sendPending] = useActionState<FormState, FormData>(
    requestMagicLink,
    null,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState<
    FormState,
    FormData
  >(verifyOtpCode, null);

  // ?error=… from the callback (failed magic-link click). Derive during render
  // via key compare to keep this off useEffect.
  const urlError = searchParams?.get("error") ?? null;
  const [lastUrlError, setLastUrlError] = useState<string | null>(urlError);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);
  if (urlError !== lastUrlError) {
    setLastUrlError(urlError);
    if (urlError) {
      setUrlErrorMessage(
        urlError === "missing-token"
          ? "De magic link miste een token. Vraag een nieuwe aan."
          : `Inloggen via de link mislukte: ${decodeURIComponent(urlError)}. Gebruik de 6-cijferige code uit dezelfde mail.`,
      );
    } else {
      setUrlErrorMessage(null);
    }
  }

  // Hard-refresh into the destination once verifyOtp set the session cookie.
  // router.push isn't enough — the server component needs a fresh fetch with
  // the new cookie attached.
  const [verifiedRedirected, setVerifiedRedirected] = useState(false);
  if (verifyState?.ok && !verifiedRedirected) {
    setVerifiedRedirected(true);
    router.replace(nextParam);
    router.refresh();
  }

  const configured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;

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

  // ────────────────────────────────────────────────────────────────
  // STEP 2: email sent — show OTP code input + resend option.
  if (sendState?.ok) {
    const verifyError =
      verifyState && !verifyState.ok
        ? verifyState.message === "rate-limited"
          ? "Te veel pogingen. Probeer het over een paar minuten opnieuw."
          : verifyState.message === "invalid-code"
            ? "De code moet alleen cijfers bevatten."
            : verifyState.message === "invalid-email"
              ? "Het e-mailadres komt niet overeen."
              : `Code-controle mislukt: ${verifyState.message}`
        : null;

    return (
      <div>
        <h2 className="serif text-2xl text-deep-brown mb-3">
          Controleer je e-mail
        </h2>
        <p className="text-muted text-sm leading-relaxed mb-6">
          We stuurden een inlog-mail naar{" "}
          <span className="text-deep-brown">{email}</span>. Klik op de link
          óf plak hieronder de <strong>6-cijferige code</strong> uit dezelfde
          mail (6 of 8 cijfers — de code werkt altijd, ook als de link &ldquo;verlopen&rdquo; geeft).
        </p>

        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
              Code uit de mail
            </span>
            <input
              type="text"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6,10}"
              maxLength={10}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="12345678"
              className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-lg tracking-[0.4em] text-center outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
            />
          </label>
          <button
            type="submit"
            disabled={verifyPending || code.length < 6}
            className="btn-primary w-full"
          >
            {verifyPending ? "Controleren…" : "Inloggen"}
          </button>
          {verifyError && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-terracotta-dark text-sm"
            >
              {verifyError}
            </p>
          )}
        </form>

        <button
          type="button"
          onClick={() => {
            setCode("");
            setVerifiedRedirected(false);
            // Force the send form to re-render by reloading; simplest reset.
            window.location.reload();
          }}
          className="mt-6 text-xs uppercase tracking-[0.18em] text-muted hover:text-deep-brown transition-colors"
        >
          Opnieuw versturen met ander adres
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 1: email entry.
  const sendError =
    sendState && !sendState.ok
      ? sendState.message === "rate-limited"
        ? "Te veel pogingen. Probeer het over een paar minuten opnieuw."
        : sendState.message === "invalid-email"
          ? "Vul een geldig e-mailadres in."
          : sendState.message
      : urlErrorMessage;

  return (
    <form action={sendAction} className="space-y-5">
      <input type="hidden" name="next" value={nextParam} />
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          aria-required="true"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jij@majorillegarden.nl"
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      </label>
      <button type="submit" disabled={sendPending} className="btn-primary w-full">
        {sendPending ? "Versturen…" : "Stuur inlog-mail"}
      </button>
      {sendError && (
        <p role="alert" aria-live="assertive" className="text-terracotta-dark text-sm">
          {sendError}
        </p>
      )}
    </form>
  );
}

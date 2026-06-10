import { recordInboundEmail } from "@/lib/inbound-email";
import { checkRateLimit } from "@/lib/ratelimit";
import { hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Inbound email webhook. Provider-agnostic by design: whatever sits in
 * front of `majorillegarden@gmail.com` (Resend Inbound, Cloudflare Email
 * Routing, SendGrid Inbound Parse, Mailgun routes) POSTs JSON here and we
 * normalise it into the `inbound_emails` table for /admin/inbox.
 *
 * Two accepted body shapes:
 *
 *   1. Resend Inbound (wrapped):
 *      { type: "email.received", data: { id, from, to[], subject,
 *        text, html, created_at, headers[] } }
 *
 *   2. Flat (everything else — Cloudflare worker, hand-rolled forwarder,
 *      SendGrid after JSON conversion):
 *      { id?, from, to, subject, text?, html?, received_at? }
 *
 * Auth: shared-secret bearer token via `INBOUND_WEBHOOK_SECRET`. Set on
 * the provider side AND in Vercel env. We reject anything else with 401
 * (unlike the Mollie webhook which always 200s — here we WANT the
 * provider to retry on misconfig so messages aren't silently dropped).
 *
 * Rate-limit: 120/min/IP — generous, since one forwarded thread can be
 * 20+ messages and providers batch.
 */
export async function POST(req: Request): Promise<Response> {
  // Auth — shared secret. Skip the check when no secret is configured so
  // local dev can curl this without ceremony; production MUST set it.
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (auth !== expected) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const rl = await checkRateLimit("inbound");
  if (!rl.ok) {
    return new Response("rate limited", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const normalised = normalisePayload(body);
  if (!normalised) {
    return new Response("invalid payload", { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    console.warn("[inbound-email] supabase not configured — dropping", {
      from: normalised.from_address,
      subject: normalised.subject,
    });
    // 200 anyway so providers don't retry forever against a misconfigured env.
    return Response.json({ ok: true, stored: false });
  }

  const stored = await recordInboundEmail(normalised);
  return Response.json({ ok: true, stored });
}

// ───────────────────────────────────────────────────────────────
// Helpers

type Normalised = {
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string;
  text_body: string | null;
  html_body: string | null;
  external_id: string | null;
  received_at: string | null;
};

/**
 * Parse "Name <email@domain>" or "email@domain" into {name, address}.
 * Returns null if no valid-looking address is present.
 */
function parseAddress(raw: unknown): { name: string | null; address: string } | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  // "Name <email@domain>"
  const m = s.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (m) {
    const name = m[1].trim().replace(/^"|"$/g, "") || null;
    const address = m[2].trim();
    if (!address.includes("@")) return null;
    return { name, address };
  }
  // bare address
  if (!s.includes("@")) return null;
  return { name: null, address: s };
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function normalisePayload(body: unknown): Normalised | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;

  // Resend Inbound wraps the message in {type, data}. Unwrap when present.
  const data: Record<string, unknown> =
    typeof obj.data === "object" && obj.data !== null
      ? (obj.data as Record<string, unknown>)
      : obj;

  const fromRaw =
    data.from ??
    data.From ??
    data.sender ??
    null;
  const from = parseAddress(fromRaw);
  if (!from) return null;

  // `to` can be a string or an array of strings (Resend ships an array).
  const toCandidate = data.to ?? data.To ?? data.recipient ?? null;
  let toAddress: string | null = null;
  if (Array.isArray(toCandidate)) {
    const first = toCandidate.find((x) => typeof x === "string") as
      | string
      | undefined;
    if (first) {
      const parsed = parseAddress(first);
      toAddress = parsed?.address ?? first;
    }
  } else {
    const parsed = parseAddress(toCandidate);
    toAddress = parsed?.address ?? asString(toCandidate);
  }
  if (!toAddress) return null;

  const subject = asString(data.subject) ?? "(no subject)";
  const text = asString(data.text) ?? asString(data["text_body"]);
  const html = asString(data.html) ?? asString(data["html_body"]);
  const externalId =
    asString(data.id) ??
    asString(data["message_id"]) ??
    asString(data["Message-Id"]);

  // Resend uses `created_at`; some others use `received_at` or `date`.
  const tsRaw =
    asString(data["received_at"]) ??
    asString(data["created_at"]) ??
    asString(data.date);
  let receivedAt: string | null = null;
  if (tsRaw) {
    const parsed = new Date(tsRaw);
    if (!Number.isNaN(parsed.getTime())) {
      receivedAt = parsed.toISOString();
    }
  }

  return {
    from_address: from.address,
    from_name: from.name,
    to_address: toAddress,
    subject,
    text_body: text,
    html_body: html,
    external_id: externalId,
    received_at: receivedAt,
  };
}

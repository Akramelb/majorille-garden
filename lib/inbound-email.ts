import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";

/**
 * Inbound email storage. Populated by `/api/inbound/email` which accepts
 * webhook payloads from whatever inbound provider sits in front of
 * `majorillegarden@gmail.com` (Resend Inbound, Cloudflare Email Routing,
 * SendGrid Parse, …). Surfaced in `/admin/inbox` via the activity feed.
 *
 * Schema is provider-agnostic: we normalise to {from, to, subject, text,
 * html, external_id}. The `external_id` carries the upstream message id so
 * duplicate deliveries (provider retries) dedupe via the unique index.
 */

export type InboundEmailRow = {
  id: string;
  created_at: string;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string;
  text_body: string | null;
  html_body: string | null;
  external_id: string | null;
};

export type NewInboundEmail = {
  from_address: string;
  from_name?: string | null;
  to_address: string;
  subject: string;
  text_body?: string | null;
  html_body?: string | null;
  external_id?: string | null;
  /** Override server-side timestamp when the provider gives us one. */
  received_at?: string | null;
};

/**
 * Insert one inbound email row. Returns `true` if a new row was created,
 * `false` if it was deduped against an existing `external_id` (or storage
 * is unavailable). Never throws — webhook handlers must always reply 200
 * to the provider regardless of DB hiccups.
 */
export async function recordInboundEmail(
  entry: NewInboundEmail,
): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    console.warn("[inbound-email] supabase not configured — dropping", {
      from: entry.from_address,
      subject: entry.subject,
    });
    return false;
  }
  try {
    const sb = getSupabaseServiceClient();
    const row: Record<string, unknown> = {
      from_address: entry.from_address,
      from_name: entry.from_name ?? null,
      to_address: entry.to_address,
      subject: entry.subject,
      text_body: entry.text_body ?? null,
      html_body: entry.html_body ?? null,
      external_id: entry.external_id ?? null,
    };
    if (entry.received_at) row.created_at = entry.received_at;

    const { error } = await sb.from("inbound_emails").insert(row);
    if (error) {
      // 23505 = unique_violation — provider retry, already stored. Silent.
      if (error.code === "23505") return false;
      console.error("[inbound-email] insert failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inbound-email] insert threw", err);
    return false;
  }
}

export async function listInboundEmails(
  limit = 200,
): Promise<InboundEmailRow[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("inbound_emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[inbound-email] list failed", error);
    return [];
  }
  return (data ?? []) as InboundEmailRow[];
}

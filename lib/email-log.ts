import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";

export type EmailLogKind =
  | "owner_notification"
  | "customer_order_confirmation"
  | "customer_booking_link"
  | "other";

export type EmailLogStatus = "sent" | "failed" | "skipped";

export type EmailLogRow = {
  id: string;
  created_at: string;
  kind: EmailLogKind;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error: string | null;
  resend_id: string | null;
  related_order_id: string | null;
  related_kind: string | null;
};

export type NewEmailLog = {
  kind: EmailLogKind;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error?: string | null;
  resend_id?: string | null;
  related_order_id?: string | null;
  related_kind?: string | null;
};

export async function logEmail(entry: NewEmailLog): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseServiceClient();
    await sb.from("email_log").insert({
      kind: entry.kind,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      error: entry.error ?? null,
      resend_id: entry.resend_id ?? null,
      related_order_id: entry.related_order_id ?? null,
      related_kind: entry.related_kind ?? null,
    });
  } catch (err) {
    // Logging an email failure shouldn't break the request — fail silently.
    console.error("[email-log] insert failed", err);
  }
}

export async function listEmailLog(limit = 200): Promise<EmailLogRow[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("email_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[email-log] list failed", error);
    return [];
  }
  return (data ?? []) as EmailLogRow[];
}

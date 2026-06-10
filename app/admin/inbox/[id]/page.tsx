import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/auth-server";
import {
  getSupabaseServiceClient,
  hasSupabaseConfig,
} from "@/lib/supabase";
import type { InboundEmailRow } from "@/lib/inbound-email";

export const dynamic = "force-dynamic";

/**
 * Inbound email detail view — `/admin/inbox/<inbound-email-uuid>`. The
 * inbox list at `/admin/inbox` links here for `inbound_email` rows so the
 * full HTML body can be read without leaving the admin shell.
 *
 * Linked HTML is sandboxed in an iframe with `sandbox=""` (no scripts, no
 * same-origin, no forms) — inbound mail is untrusted input and we never
 * dump it into our own DOM. Plain text is shown as `<pre>` when only
 * text/plain is available.
 */
export default async function InboundEmailDetail(
  props: PageProps<"/admin/inbox/[id]">,
) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const { id } = await props.params;
  if (!id || !hasSupabaseConfig()) notFound();

  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("inbound_emails")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();

  const row = data as InboundEmailRow;
  const fromLabel = row.from_name
    ? `${row.from_name} <${row.from_address}>`
    : row.from_address;
  const replyHref = `mailto:${row.from_address}?subject=${encodeURIComponent(
    row.subject.startsWith("Re:") ? row.subject : `Re: ${row.subject}`,
  )}`;
  const receivedAt = new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(row.created_at));

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title={row.subject || "(no subject)"}
        description={`Van ${fromLabel} — ontvangen ${receivedAt}`}
      >
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/admin/inbox" className="btn-secondary">
            ← Inbox
          </Link>
          <a href={replyHref} className="btn-primary">
            Antwoord via Gmail
          </a>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm mb-8 bg-cream border border-border/50 rounded-sm p-4">
          <dt className="text-muted">Van</dt>
          <dd className="text-deep-brown break-all">{fromLabel}</dd>
          <dt className="text-muted">Aan</dt>
          <dd className="text-deep-brown break-all">{row.to_address}</dd>
          <dt className="text-muted">Onderwerp</dt>
          <dd className="text-deep-brown break-words">{row.subject}</dd>
          <dt className="text-muted">Ontvangen</dt>
          <dd className="text-deep-brown">{receivedAt}</dd>
        </dl>

        {row.html_body ? (
          // Untrusted HTML — sandbox blocks scripts, forms, same-origin reads.
          // srcDoc avoids a network round-trip; the iframe is the renderer
          // boundary, not the storage boundary.
          <iframe
            sandbox=""
            srcDoc={row.html_body}
            title="Email body"
            className="w-full min-h-[600px] bg-white border border-border/50 rounded-sm"
          />
        ) : row.text_body ? (
          <pre className="whitespace-pre-wrap break-words text-sm text-deep-brown bg-white border border-border/50 rounded-sm p-4">
            {row.text_body}
          </pre>
        ) : (
          <p className="text-muted text-sm py-4 px-5 bg-sand/30 border border-border/30 rounded-sm">
            Geen body opgeslagen voor dit bericht.
          </p>
        )}
      </AdminPage>
    </AdminShell>
  );
}

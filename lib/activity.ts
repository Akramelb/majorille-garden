import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";

/**
 * Unified activity feed for /admin/inbox. Pulls recent rows from every
 * user-facing source (orders, contact form, reviews, newsletter, email_log)
 * and maps them to a single ActivityItem shape sorted by timestamp desc.
 *
 * Fan-out fetch per table at the cost of N round-trips — fine for the data
 * volumes this site sees. If we ever need scale, fold into a SQL UNION.
 */

export type ActivityKind =
  | "order_paid"
  | "order_pending"
  | "contact"
  | "review"
  | "newsletter"
  | "email_sent"
  | "email_failed"
  | "email_skipped"
  | "inbound_email";

export type ActivityItem = {
  id: string;
  ts: string; // ISO
  kind: ActivityKind;
  title: string;
  detail: string;
  meta?: Record<string, string | number | null>;
  href?: string;
};

// Per-source row shapes — narrowed to the columns we actually select.
type OrderRow = {
  id: string;
  created_at: string;
  kind: "booking" | "product";
  status: string;
  customer_email: string;
  customer_name: string | null;
  amount_cents: number;
  currency: string;
  service_slug: string | null;
  audience: "women" | "men" | null;
  line_items: { qty: number; name_nl: string }[] | null;
  locale: "nl" | "en";
};
type ContactRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
};
type ReviewRow = {
  id: string;
  created_at: string;
  author_name: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
};
type NewsletterRow = {
  email: string;
  created_at: string;
};
type EmailRow = {
  id: string;
  created_at: string;
  kind: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
};
type InboundEmailRow = {
  id: string;
  created_at: string;
  from_address: string;
  from_name: string | null;
  subject: string;
  text_body: string | null;
};

function truncate(s: string | null | undefined, max = 80): string {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function formatAmount(cents: number, currency: string, locale: "nl" | "en"): string {
  // Format at the render boundary only (rule 17).
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "nl-NL", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export async function getActivityFeed(opts?: {
  limit?: number;
  kinds?: ActivityKind[];
}): Promise<ActivityItem[]> {
  if (!hasSupabaseConfig()) return [];
  const limit = opts?.limit ?? 200;
  const sb = getSupabaseServiceClient();

  // Fetch from each table in parallel, capped at `limit` each. For a small
  // site this is fine; for scale we'd union+limit in SQL.
  const [orders, contacts, reviews, newsletter, emails, inbound] = await Promise.all([
    sb
      .from("orders")
      .select(
        "id, created_at, kind, status, customer_email, customer_name, amount_cents, currency, service_slug, audience, line_items, locale",
      )
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as OrderRow[]),
    sb
      .from("contact_submissions")
      .select("id, created_at, name, email, message")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as ContactRow[]),
    sb
      .from("reviews")
      .select("id, created_at, author_name, rating, body, status")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as ReviewRow[]),
    sb
      .from("newsletter_subscribers")
      .select("email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as NewsletterRow[]),
    sb
      .from("email_log")
      .select("id, created_at, kind, recipient, subject, status")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as EmailRow[]),
    sb
      .from("inbound_emails")
      .select("id, created_at, from_address, from_name, subject, text_body")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((r) => (r.data ?? []) as InboundEmailRow[]),
  ]);

  const items: ActivityItem[] = [];

  // Orders — skip the noisy failed/expired/canceled states. paid + pending
  // (open/authorized) carry actionable signal.
  for (const o of orders) {
    if (
      o.status === "failed" ||
      o.status === "expired" ||
      o.status === "canceled" ||
      o.status === "refunded"
    ) {
      continue;
    }
    const isPaid = o.status === "paid";
    const kind: ActivityKind = isPaid ? "order_paid" : "order_pending";
    const who = o.customer_name?.trim() || o.customer_email;
    const title =
      o.kind === "booking"
        ? `${isPaid ? "Paid booking" : "Pending booking"}: ${who}`
        : `${isPaid ? "Paid order" : "Pending order"}: ${who}`;
    let detail: string;
    if (o.kind === "booking") {
      const aud = o.audience ? ` (${o.audience})` : "";
      const svc = o.service_slug ?? "—";
      detail = `${svc}${aud} — ${formatAmount(o.amount_cents, o.currency, o.locale)}`;
    } else {
      const count = (o.line_items ?? []).reduce(
        (n, li) => n + (Number(li.qty) || 0),
        0,
      );
      const itemsLabel = count === 1 ? "1 item" : `${count} items`;
      detail = `${itemsLabel} — ${formatAmount(o.amount_cents, o.currency, o.locale)}`;
    }
    items.push({
      id: `order:${o.id}`,
      ts: o.created_at,
      kind,
      title,
      detail,
      href: "/admin/orders",
    });
  }

  // Contact submissions
  for (const c of contacts) {
    items.push({
      id: `contact:${c.id}`,
      ts: c.created_at,
      kind: "contact",
      title: `Contact form: ${c.name}`,
      detail: truncate(c.message, 80),
      href: "/admin",
    });
  }

  // Reviews — all statuses surface in the feed; the row text carries the
  // status so the moderator can spot pending submissions at a glance.
  for (const r of reviews) {
    items.push({
      id: `review:${r.id}`,
      ts: r.created_at,
      kind: "review",
      title: `Review submitted: ${r.rating}★ from ${r.author_name}`,
      detail: truncate(r.body, 80),
      meta: { status: r.status },
      href: "/admin/reviews",
    });
  }

  // Newsletter signups
  for (const n of newsletter) {
    items.push({
      id: `newsletter:${n.email}:${n.created_at}`,
      ts: n.created_at,
      kind: "newsletter",
      title: "Newsletter signup",
      detail: n.email,
    });
  }

  // Email log — one row per Resend send/skip/failure
  for (const e of emails) {
    const kind: ActivityKind =
      e.status === "sent"
        ? "email_sent"
        : e.status === "failed"
          ? "email_failed"
          : "email_skipped";
    items.push({
      id: `email:${e.id}`,
      ts: e.created_at,
      kind,
      title: `Email ${e.status}: ${e.subject}`,
      detail: `to ${e.recipient} (${e.kind})`,
    });
  }

  // Inbound emails — what landed in majorillegarden@gmail.com (forwarded
  // here via Resend Inbound / Cloudflare Email Routing). The detail line is
  // a short preview of the plain-text body when present.
  for (const m of inbound) {
    const who = m.from_name?.trim() || m.from_address;
    items.push({
      id: `inbound:${m.id}`,
      ts: m.created_at,
      kind: "inbound_email",
      title: `Inbound: ${m.subject || "(no subject)"}`,
      detail: m.text_body ? `${who} — ${truncate(m.text_body, 80)}` : who,
      href: `/admin/inbox/${m.id}`,
    });
  }

  items.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  const filtered = opts?.kinds && opts.kinds.length > 0
    ? items.filter((i) => opts.kinds!.includes(i.kind))
    : items;

  return filtered.slice(0, limit);
}

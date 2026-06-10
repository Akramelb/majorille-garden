import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getActivityFeed, type ActivityItem, type ActivityKind } from "@/lib/activity";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminInbox() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  // getActivityFeed gracefully returns [] when Supabase env is missing (rule 14).
  const items = await getActivityFeed({ limit: 200 });
  const grouped = groupByDay(items);

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Inbox"
        description="Alles wat er op de site gebeurt — betaalde orders, contactformulieren, reviews, nieuwsbrief en elke verzonden e-mail."
      >
        {items.length === 0 ? (
          <Empty>Nog geen activiteit.</Empty>
        ) : (
          <div className="space-y-10">
            {grouped.map((group) => (
              <section key={group.label}>
                <h2 className="serif text-2xl text-deep-brown mb-4">
                  {group.label}
                  <span className="ml-3 text-xs uppercase tracking-[0.18em] text-muted">
                    {group.items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </AdminPage>
    </AdminShell>
  );
}

// ───────────────────────────────────────────────────────────────
// Per-row server components

function Row({ item }: { item: ActivityItem }) {
  const body = (
    <article className="bg-cream border border-border/50 rounded-sm p-4 hover:border-deep-brown/30 transition-colors">
      <div className="flex flex-wrap items-start gap-3">
        <time className="text-xs text-muted font-mono shrink-0 w-12 pt-0.5">
          {fmtTime(item.ts)}
        </time>
        <KindPill kind={item.kind} />
        <div className="min-w-0 flex-1 w-full">
          <p className="text-deep-brown font-medium text-sm leading-snug break-words">
            {item.title}
          </p>
          {item.detail && (
            <p
              className="mt-1 text-xs text-muted truncate"
              title={item.detail}
            >
              {item.detail}
            </p>
          )}
        </div>
      </div>
    </article>
  );
  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

// ───────────────────────────────────────────────────────────────
// Helpers + small presentational components

function KindPill({ kind }: { kind: ActivityKind }) {
  // Color rules per spec: paid=olive, pending=sand, contact=terracotta,
  // review=sand, newsletter=muted-olive, email_sent=olive,
  // email_failed=terracotta, email_skipped=muted.
  const { cls, label } = (() => {
    switch (kind) {
      case "order_paid":
        return { cls: "bg-olive text-cream", label: "Paid" };
      case "order_pending":
        return { cls: "bg-sand text-deep-brown", label: "Pending" };
      case "contact":
        return { cls: "bg-terracotta text-cream", label: "Contact" };
      case "review":
        return { cls: "bg-sand text-deep-brown", label: "Review" };
      case "newsletter":
        return {
          cls: "bg-olive/30 text-deep-brown border border-olive/40",
          label: "Newsletter",
        };
      case "email_sent":
        return { cls: "bg-olive text-cream", label: "Email" };
      case "email_failed":
        return { cls: "bg-terracotta text-cream", label: "Email fail" };
      case "email_skipped":
        return {
          cls: "bg-cream text-muted border border-border",
          label: "Email skip",
        };
      case "inbound_email":
        return {
          cls: "bg-deep-brown text-cream",
          label: "Inbox",
        };
    }
  })();
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm shrink-0 ${cls}`}
    >
      {label}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-sm py-4 px-5 bg-sand/30 border border-border/30 rounded-sm">
      {children}
    </p>
  );
}

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function fmtDayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - that.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Vandaag";
  if (diffDays === 1) return "Gisteren";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: that.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(d);
}

function groupByDay(
  items: ActivityItem[],
): { label: string; items: ActivityItem[] }[] {
  const groups = new Map<string, { label: string; items: ActivityItem[] }>();
  for (const item of items) {
    const d = new Date(item.ts);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { label: fmtDayLabel(d), items: [item] });
    }
  }
  return Array.from(groups.values());
}

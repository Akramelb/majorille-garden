import { redirect } from "next/navigation";
import {
  Inbox,
  Mail,
  Star as StarIcon,
  BookOpen,
} from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";
import { getReviewStats, getReviewsByStatus } from "@/lib/reviews";
import { getAllPosts } from "@/lib/blog";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

type ContactRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
};
type SubRow = { id: string; created_at: string; email: string };

export default async function AdminDashboard() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  let contacts: ContactRow[] = [];
  let subs: SubRow[] = [];
  if (hasSupabaseConfig()) {
    const sb = getSupabaseServiceClient();
    const [c, s] = await Promise.all([
      sb
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
      sb
        .from("newsletter_subscribers")
        .select("id,created_at,email")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    contacts = (c.data as ContactRow[]) ?? [];
    subs = (s.data as SubRow[]) ?? [];
  }

  const [reviewStats, pendingReviews, posts] = await Promise.all([
    getReviewStats(),
    getReviewsByStatus("pending", 1),
    getAllPosts(),
  ]);

  const unreadCount = contacts.filter((c) => !c.read).length;
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.length - publishedCount;
  const greeting = welcome(user.email ?? "");

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title={greeting.title}
        description={greeting.subtitle}
      >
        {/* Stat grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Stat
            icon={<Inbox size={16} />}
            label="Contactberichten"
            value={contacts.length === 8 ? "8+" : String(contacts.length)}
            sub={
              unreadCount > 0
                ? `${unreadCount} ongelezen`
                : "Alles bekeken"
            }
            highlight={unreadCount > 0}
          />
          <Stat
            icon={<Mail size={16} />}
            label="Nieuwsbrief"
            value={String(subs.length)}
            sub={subs.length === 0 ? "Nog leeg" : "Inschrijvingen"}
          />
          <Stat
            icon={<StarIcon size={16} />}
            label="Reviews"
            value={
              reviewStats ? reviewStats.avg.toFixed(1) : "—"
            }
            sub={
              reviewStats
                ? `${reviewStats.count} goedgekeurd${pendingReviews.length ? ` · ${pendingReviews.length}+ in wachtrij` : ""}`
                : "Nog geen reviews"
            }
            highlight={pendingReviews.length > 0}
          />
          <Stat
            icon={<BookOpen size={16} />}
            label="Journal"
            value={String(publishedCount)}
            sub={
              draftCount > 0
                ? `${draftCount} concept${draftCount === 1 ? "" : "en"} klaar`
                : "Alles gepubliceerd"
            }
            highlight={draftCount > 0}
          />
        </section>

        {/* Recent contact submissions */}
        <section className="mb-12">
          <SectionHeader
            title="Recente berichten"
            kicker="Contact"
            cta={
              contacts.length > 0 ? (
                <span className="text-xs text-muted">
                  Laatste {contacts.length}
                </span>
              ) : null
            }
          />
          {contacts.length === 0 ? (
            <Empty>Nog geen contactberichten.</Empty>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <article
                  key={c.id}
                  className="bg-cream border border-border/50 p-5 rounded-sm hover:border-deep-brown/30 transition-colors"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p className="min-w-0 break-words">
                      <span className="text-deep-brown font-medium break-words">
                        {c.name}
                      </span>
                      {" — "}
                      <a
                        href={`mailto:${c.email}`}
                        title={c.email}
                        className="text-terracotta text-sm hover:underline break-all"
                      >
                        {c.email}
                      </a>
                      {c.phone && (
                        <span className="text-muted text-sm break-all">
                          {" · "}
                          {c.phone}
                        </span>
                      )}
                    </p>
                    <time className="text-xs text-muted shrink-0">{fmtDate(c.created_at)}</time>
                  </header>
                  <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed break-words">
                    {c.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter */}
        <section>
          <SectionHeader
            title="Nieuwsbrief"
            kicker="Inschrijvingen"
            cta={
              subs.length > 0 ? (
                <span className="text-xs text-muted">
                  Laatste {subs.length}
                </span>
              ) : null
            }
          />
          {subs.length === 0 ? (
            <Empty>Nog geen inschrijvingen.</Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subs.map((s) => (
                <span
                  key={s.id}
                  className="text-xs bg-sand/40 border border-border/40 rounded-sm px-3 py-1.5 text-deep-brown break-all max-w-full"
                  title={`${s.email} · ${fmtDate(s.created_at)}`}
                >
                  {s.email}
                </span>
              ))}
            </div>
          )}
        </section>
      </AdminPage>
    </AdminShell>
  );
}

// ───────────────────────────────────────────────────────────────
// Helpers + small server components

function welcome(email: string) {
  const hour = new Date().getHours();
  const tod =
    hour < 6
      ? "Goedenacht"
      : hour < 12
        ? "Goedemorgen"
        : hour < 18
          ? "Goedemiddag"
          : "Goedenavond";
  const name = email.split("@")[0]?.split(/[._-]/)[0];
  const cap = name ? name[0].toUpperCase() + name.slice(1) : "";
  return {
    title: cap ? `${tod}, ${cap}` : tod,
    subtitle: new Date().toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-cream border border-border/50 rounded-sm p-5 relative overflow-hidden">
      {highlight && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-terracotta animate-pulse" />
      )}
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
        <span className="text-terracotta">{icon}</span>
        {label}
      </div>
      <p className="mt-3 serif text-4xl text-deep-brown leading-none">{value}</p>
      <p className="mt-2 text-xs text-muted">{sub}</p>
    </div>
  );
}

function SectionHeader({
  title,
  kicker,
  cta,
}: {
  title: string;
  kicker?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        {kicker && (
          <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta mb-1">
            {kicker}
          </p>
        )}
        <h2 className="serif text-2xl text-deep-brown leading-tight">{title}</h2>
      </div>
      {cta}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-sm py-4 px-5 bg-sand/30 border border-border/30 rounded-sm">
      {children}
    </p>
  );
}


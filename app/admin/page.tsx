import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Inbox,
  Mail,
  Star as StarIcon,
  BookOpen,
  ExternalLink,
  ArrowUpRight,
  Activity,
  GitCommit,
  Sparkles,
} from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";
import { getReviewStats, getReviewsByStatus } from "@/lib/reviews";
import { getAllPosts } from "@/lib/blog";
import {
  getRecentDeployments,
  hasVercelApiToken,
  vercelDashboardUrls,
  type DeploymentSummary,
} from "@/lib/vercel";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { StarRating } from "@/components/sections/StarRating";

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

  const [reviewStats, pendingReviews, posts, deployments] = await Promise.all([
    getReviewStats(),
    getReviewsByStatus("pending", 1),
    getAllPosts(),
    getRecentDeployments(5),
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

        {/* Vercel — site health */}
        <section className="mb-12">
          <SectionHeader
            title="Site & performance"
            kicker="Vercel"
            cta={
              <a
                href={vercelDashboardUrls.overview}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-[0.2em] text-deep-brown hover:text-terracotta inline-flex items-center gap-1"
              >
                Projectoverzicht <ExternalLink size={11} />
              </a>
            }
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <VercelLinkCard
              icon={<Activity size={16} />}
              label="Web Analytics"
              caption="Bezoekers, pageviews, herkomst"
              href={vercelDashboardUrls.analytics}
            />
            <VercelLinkCard
              icon={<Sparkles size={16} />}
              label="Speed Insights"
              caption="Core Web Vitals: LCP, CLS, INP"
              href={vercelDashboardUrls.speedInsights}
            />
            <VercelLinkCard
              icon={<GitCommit size={16} />}
              label="Logs & deploys"
              caption="Runtime errors + edge logs"
              href={vercelDashboardUrls.logs}
            />
          </div>

          <DeploymentsBlock deployments={deployments} hasToken={hasVercelApiToken()} />
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
                    <p>
                      <span className="text-deep-brown font-medium">
                        {c.name}
                      </span>
                      {" — "}
                      <a
                        href={`mailto:${c.email}`}
                        className="text-terracotta text-sm hover:underline"
                      >
                        {c.email}
                      </a>
                      {c.phone && (
                        <span className="text-muted text-sm">
                          {" · "}
                          {c.phone}
                        </span>
                      )}
                    </p>
                    <time className="text-xs text-muted">{fmtDate(c.created_at)}</time>
                  </header>
                  <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
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
                  className="text-xs bg-sand/40 border border-border/40 rounded-sm px-3 py-1.5 text-deep-brown"
                  title={fmtDate(s.created_at)}
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

function VercelLinkCard({
  icon,
  label,
  caption,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group bg-cream border border-border/50 rounded-sm p-5 flex flex-col gap-2 hover:border-deep-brown/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-terracotta">{icon}</span>
        <ArrowUpRight
          size={14}
          className="text-muted group-hover:text-deep-brown transition-colors"
        />
      </div>
      <p className="serif text-xl text-deep-brown leading-tight">{label}</p>
      <p className="text-xs text-muted">{caption}</p>
    </a>
  );
}

function DeploymentsBlock({
  deployments,
  hasToken,
}: {
  deployments: DeploymentSummary[];
  hasToken: boolean;
}) {
  if (!hasToken) {
    return (
      <div className="mt-4 px-5 py-4 bg-sand/40 border-l-2 border-terracotta text-sm">
        <p className="text-deep-brown font-medium mb-1">
          Verbind live deploy-data
        </p>
        <p className="text-muted text-xs leading-relaxed">
          Voeg <code className="bg-cream px-1.5 py-0.5">VERCEL_API_TOKEN</code>{" "}
          (scope: <em>Deployments: Read</em>) en optioneel{" "}
          <code className="bg-cream px-1.5 py-0.5">VERCEL_TEAM_ID</code> toe aan
          de Vercel-env, dan verschijnt hier een live lijst met de laatste
          deploys.
        </p>
      </div>
    );
  }
  if (deployments.length === 0) {
    return null;
  }
  return (
    <div className="mt-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">
        Laatste deploys
      </p>
      <ul className="divide-y divide-border/40 border-y border-border/40">
        {deployments.map((d) => (
          <li
            key={d.uid}
            className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0">
              <p className="text-deep-brown truncate">
                <span
                  className={
                    d.state === "READY"
                      ? "text-olive"
                      : d.state === "ERROR"
                        ? "text-terracotta"
                        : "text-muted"
                  }
                >
                  ●
                </span>{" "}
                {d.meta?.githubCommitMessage?.split("\n")[0] ?? d.url}
              </p>
              <p className="text-xs text-muted truncate">
                {d.meta?.githubCommitSha?.slice(0, 7) ?? d.uid.slice(0, 7)} ·{" "}
                {d.target ?? "preview"} · {d.state.toLowerCase()}
              </p>
            </div>
            <a
              href={`https://${d.url}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-terracotta hover:underline inline-flex items-center gap-1"
            >
              Open <ExternalLink size={11} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

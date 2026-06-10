import { redirect } from "next/navigation";
import {
  Activity,
  GitBranch,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import {
  getProjectInfo,
  getRecentDeployments,
  getDeploymentStats,
  getDomainsForProject,
  hasVercelConfig,
  type DeploymentSummary,
  type DomainInfo,
  type DomainStatus,
  type ProjectInfo,
} from "@/lib/vercel";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function Workspace() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const configured = hasVercelConfig();

  // All helpers gracefully degrade to null/[]/empty when env is missing
  // (rule 14), so this fans out safely either way.
  const [project, deployments, stats, domains] = await Promise.all([
    getProjectInfo(),
    getRecentDeployments(20),
    getDeploymentStats(),
    getDomainsForProject(),
  ]);

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Akrams Workspace"
        description="Live Vercel stats voor majorille-garden."
      >
        {!configured && <EmptyBanner />}

        {/* Project info */}
        <section className="mb-12">
          <SectionHeader title="Project" kicker="Vercel" />
          <ProjectCard project={project} />
        </section>

        {/* Stats grid */}
        <section className="mb-12">
          <SectionHeader
            title="Deploy stats"
            kicker={
              stats.window > 0
                ? `Laatste ${stats.window} deploys`
                : "Geen data"
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity size={16} />}
              label="Totaal"
              value={String(stats.total)}
              sub={
                stats.window > 0
                  ? `${stats.last7Days} laatste 7d · ${stats.last30Days} in 30d`
                  : "Nog geen deploys"
              }
            />
            <StatCard
              icon={<GitBranch size={16} />}
              label="Production"
              value={String(stats.production)}
              sub={
                stats.total - stats.production > 0
                  ? `${stats.total - stats.production} previews`
                  : "Alles production"
              }
            />
            <StatCard
              icon={<CheckCircle2 size={16} />}
              label="Success rate"
              value={stats.window > 0 ? `${stats.successRatePct}%` : "—"}
              sub={
                stats.window > 0
                  ? `${stats.successful} ready · ${stats.errors} errors`
                  : "—"
              }
              highlight={stats.errors > 0}
            />
            <StatCard
              icon={<Clock size={16} />}
              label="Avg build"
              value={
                stats.avgBuildSeconds !== null
                  ? `${stats.avgBuildSeconds}s`
                  : "—"
              }
              sub="Build → ready"
            />
          </div>
        </section>

        {/* Recent deployments */}
        <section className="mb-12">
          <SectionHeader
            title="Recente deploys"
            kicker={
              deployments.length > 0
                ? `Laatste ${deployments.length}`
                : "Leeg"
            }
          />
          {deployments.length === 0 ? (
            <Empty>Nog geen deploy-data beschikbaar.</Empty>
          ) : (
            <div className="space-y-3">
              {deployments.map((d) => (
                <DeploymentRow key={d.uid} deployment={d} />
              ))}
            </div>
          )}
        </section>

        {/* Domains */}
        <section>
          <SectionHeader
            title="Domains"
            kicker={
              domains.length > 0 ? `${domains.length} verbonden` : "Geen data"
            }
          />
          {domains.length === 0 ? (
            <Empty>Geen domains geladen — token mist mogelijk scope.</Empty>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <DomainRow key={d.name} domain={d} />
              ))}
            </div>
          )}
        </section>
      </AdminPage>
    </AdminShell>
  );
}

// ───────────────────────────────────────────────────────────────
// Sections

function EmptyBanner() {
  return (
    <div className="mb-10 px-5 py-4 bg-sand/40 border-l-2 border-terracotta text-sm">
      <p className="text-deep-brown font-medium mb-1">
        Verbind Vercel om live stats te zien
      </p>
      <p className="text-muted text-xs leading-relaxed">
        Voeg <code className="bg-cream px-1.5 py-0.5">VERCEL_API_TOKEN</code>{" "}
        (scope: <em>Deployments + Project: Read</em>) en optioneel{" "}
        <code className="bg-cream px-1.5 py-0.5">VERCEL_TEAM_ID</code> toe aan
        de Vercel-env, dan verschijnt hier projectinfo, deploy stats en
        domains.
      </p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectInfo | null }) {
  if (!project) {
    return (
      <Empty>Geen projectinfo — token mist of de API gaf een fout.</Empty>
    );
  }
  return (
    <article className="bg-cream border border-border/50 rounded-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta mb-1">
            {project.framework ?? "Project"}
          </p>
          <h3 className="serif text-2xl text-deep-brown leading-tight break-words">
            {project.name}
          </h3>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {project.createdAt && (
              <Pair label="Aangemaakt" value={fmtDate(project.createdAt)} />
            )}
            {project.nodeVersion && (
              <Pair label="Node" value={project.nodeVersion} />
            )}
            {project.link?.productionBranch && (
              <Pair
                label="Production branch"
                value={project.link.productionBranch}
              />
            )}
            {project.link?.repo && (
              <Pair label="Repo" value={project.link.repo} mono />
            )}
          </dl>
        </div>
        <a
          href={project.dashboardUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted hover:text-deep-brown inline-flex items-center gap-1 self-start shrink-0"
        >
          Open in Vercel <ExternalLink size={11} />
        </a>
      </div>
    </article>
  );
}

function DeploymentRow({ deployment }: { deployment: DeploymentSummary }) {
  const commit = deployment.meta?.githubCommitMessage?.split("\n")[0] ?? null;
  const ref = deployment.meta?.githubCommitRef ?? null;
  const sha =
    deployment.meta?.githubCommitSha?.slice(0, 7) ??
    deployment.uid.slice(0, 7);
  const duration =
    deployment.buildingAt && deployment.ready
      ? `${Math.max(1, Math.round((deployment.ready - deployment.buildingAt) / 1000))}s`
      : null;
  const isoCreated = new Date(deployment.createdAt).toISOString();

  return (
    <article className="bg-cream border border-border/50 rounded-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <DeployStatePill state={deployment.state} />
            <TargetPill target={deployment.target} />
            {ref && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                <GitBranch size={10} /> {ref}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono">
              {sha}
            </span>
          </div>
          <p
            className="text-sm text-deep-brown break-words"
            title={commit ?? undefined}
          >
            {commit ? truncate(commit, 80) : deployment.url}
          </p>
          <p className="mt-1 text-xs text-muted break-all">
            <a
              href={`https://${deployment.url}`}
              target="_blank"
              rel="noreferrer"
              className="text-terracotta hover:underline"
            >
              {deployment.url}
            </a>
          </p>
        </div>
        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 text-xs text-muted shrink-0">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {duration}
            </span>
          )}
          <time title={isoCreated}>{fmtRelative(deployment.createdAt)}</time>
        </div>
      </div>
    </article>
  );
}

function DomainRow({ domain }: { domain: DomainInfo }) {
  return (
    <article className="bg-cream border border-border/50 rounded-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <DomainStatusPill status={domain.status} />
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Globe size={11} />
            </span>
            <span className="text-sm text-deep-brown break-all">
              {domain.name}
            </span>
          </div>
          <p className="text-xs text-muted">
            {domain.gitBranch && (
              <span className="inline-flex items-center gap-1 mr-3">
                <GitBranch size={10} /> {domain.gitBranch}
              </span>
            )}
            {domain.redirect && (
              <span className="break-all">
                Redirect → {domain.redirect}
                {domain.redirectStatusCode
                  ? ` (${domain.redirectStatusCode})`
                  : ""}
              </span>
            )}
            {!domain.gitBranch && !domain.redirect && (
              <span>Geen git-branch of redirect ingesteld.</span>
            )}
          </p>
        </div>
        <a
          href={`https://${domain.name}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted hover:text-deep-brown inline-flex items-center gap-1 self-start shrink-0"
        >
          Open <ExternalLink size={11} />
        </a>
      </div>
    </article>
  );
}

// ───────────────────────────────────────────────────────────────
// Small presentational pieces

function SectionHeader({
  title,
  kicker,
}: {
  title: string;
  kicker?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        {kicker && (
          <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta mb-1">
            {kicker}
          </p>
        )}
        <h2 className="serif text-2xl text-deep-brown leading-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}

function StatCard({
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
      <p className="mt-3 serif text-3xl lg:text-4xl text-deep-brown leading-none break-words">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{sub}</p>
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

function Pair({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd
        className={`text-sm text-deep-brown break-words ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function DeployStatePill({ state }: { state: string }) {
  // READY = olive, ERROR = terracotta, BUILDING/QUEUED = sand, CANCELED = muted
  const cls =
    state === "READY"
      ? "bg-olive text-cream"
      : state === "ERROR"
        ? "bg-terracotta text-cream"
        : state === "BUILDING" || state === "QUEUED" || state === "INITIALIZING"
          ? "bg-sand text-deep-brown"
          : "bg-cream text-muted border border-border";
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm ${cls}`}
    >
      {state.toLowerCase()}
    </span>
  );
}

function TargetPill({ target }: { target: string | null }) {
  const isProd = target === "production";
  const cls = isProd
    ? "bg-deep-brown text-cream"
    : "bg-sand/60 text-deep-brown";
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm ${cls}`}
    >
      {target ?? "preview"}
    </span>
  );
}

function DomainStatusPill({ status }: { status: DomainStatus }) {
  const cls =
    status === "verified" || status === "git-attached"
      ? "bg-olive text-cream"
      : status === "pending"
        ? "bg-sand text-deep-brown"
        : "bg-terracotta text-cream";
  const label =
    status === "git-attached"
      ? "verified"
      : status === "misconfigured"
        ? "misconfigured"
        : status;
  const Icon =
    status === "misconfigured" ? AlertTriangle : CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm ${cls}`}
    >
      <Icon size={10} /> {label}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────
// Format helpers

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtRelative(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}


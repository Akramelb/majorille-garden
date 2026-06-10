import "server-only";

// Vercel project identity (filled at link time, lives in .vercel/project.json
// but we hardcode the public bits here so the admin dashboard works in any
// build context). Replace if you ever move the project.
const PROJECT_NAME = "majorille-garden";
const TEAM_SLUG = "akramelbs-projects";

export const vercelDashboardUrls = {
  overview: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}`,
  analytics: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}/analytics`,
  speedInsights: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}/speed-insights`,
  deployments: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}/deployments`,
  logs: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}/logs`,
  settings: `https://vercel.com/${TEAM_SLUG}/${PROJECT_NAME}/settings`,
} as const;

export function hasVercelApiToken(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN);
}

/** Alias preferred in newer code — same gate as hasVercelApiToken. */
export function hasVercelConfig(): boolean {
  return hasVercelApiToken();
}

function teamQuery(prefix: "?" | "&" = "&"): string {
  return process.env.VERCEL_TEAM_ID
    ? `${prefix}teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
    : "";
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` };
}

export type DeploymentSummary = {
  uid: string;
  url: string;
  state: string; // READY | BUILDING | ERROR | CANCELED | QUEUED
  target: string | null; // production | staging | null
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  inspectorUrl?: string;
  meta?: {
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
};

/**
 * Recent deployments via Vercel REST API. Returns [] if no token is set or the
 * call fails — the dashboard renders a "Connect Vercel" CTA in either case.
 * Requires a token with `Deployments: Read` scope.
 *
 * NB: removed the `&target=production` filter so the workspace page can show
 * preview deploys too; downstream callers filter to production when needed.
 */
export async function getRecentDeployments(
  limit = 5,
): Promise<DeploymentSummary[]> {
  if (!hasVercelApiToken()) return [];
  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?app=${PROJECT_NAME}&limit=${limit}${teamQuery()}`,
      {
        headers: authHeaders(),
        // Short-cache so the admin reflects new pushes quickly without
        // hammering the API.
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      console.warn("[vercel] deployments fetch failed", res.status);
      return [];
    }
    const data = await res.json();
    return (data.deployments ?? []).map((d: Record<string, unknown>) => ({
      uid: d.uid as string,
      url: d.url as string,
      state: d.state as string,
      target: (d.target as string | null) ?? null,
      createdAt: d.created as number,
      buildingAt: d.buildingAt as number | undefined,
      ready: d.ready as number | undefined,
      inspectorUrl: d.inspectorUrl as string | undefined,
      meta: d.meta as DeploymentSummary["meta"],
    }));
  } catch (err) {
    console.warn(
      "[vercel] deployments fetch threw",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

// ───────────────────────────────────────────────────────────────
// Project info

export type ProjectInfo = {
  id: string;
  name: string;
  framework: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  nodeVersion: string | null;
  latestProductionDeploymentId: string | null;
  link: {
    type: string | null;
    repo: string | null;
    productionBranch: string | null;
  } | null;
  dashboardUrl: string;
};

/**
 * Project metadata via the Vercel REST API. Returns null if env is missing
 * or the request fails — the workspace page renders a fallback in that case.
 */
export async function getProjectInfo(): Promise<ProjectInfo | null> {
  if (!hasVercelConfig()) return null;
  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}${teamQuery("?")}`,
      {
        headers: authHeaders(),
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      console.warn("[vercel] project info fetch failed", res.status);
      return null;
    }
    const d = (await res.json()) as Record<string, unknown>;
    const link = (d.link as Record<string, unknown> | null) ?? null;
    const targets = d.targets as
      | Record<string, Record<string, unknown> | null>
      | undefined;
    const productionTarget = targets?.production ?? null;
    return {
      id: d.id as string,
      name: d.name as string,
      framework: (d.framework as string | null) ?? null,
      createdAt: (d.createdAt as number | null) ?? null,
      updatedAt: (d.updatedAt as number | null) ?? null,
      nodeVersion: (d.nodeVersion as string | null) ?? null,
      latestProductionDeploymentId:
        (productionTarget?.id as string | null) ?? null,
      link: link
        ? {
            type: (link.type as string | null) ?? null,
            repo:
              (link.repo as string | null) ??
              (link.org && link.repo
                ? `${link.org as string}/${link.repo as string}`
                : null),
            productionBranch:
              (link.productionBranch as string | null) ?? null,
          }
        : null,
      dashboardUrl: vercelDashboardUrls.overview,
    };
  } catch (err) {
    console.warn(
      "[vercel] project info threw",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Deployment detail

export type DeploymentDetail = {
  uid: string;
  url: string;
  readyState: string;
  target: string | null;
  createdAt: number | null;
  buildingAt: number | null;
  ready: number | null;
  durationMs: number | null;
  creatorUsername: string | null;
  gitRef: string | null;
  gitSha: string | null;
  gitMessage: string | null;
};

export async function getDeploymentDetail(
  deploymentId: string,
): Promise<DeploymentDetail | null> {
  if (!hasVercelConfig()) return null;
  try {
    const res = await fetch(
      `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}${teamQuery("?")}`,
      {
        headers: authHeaders(),
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      console.warn("[vercel] deployment detail fetch failed", res.status);
      return null;
    }
    const d = (await res.json()) as Record<string, unknown>;
    const creator = d.creator as Record<string, unknown> | undefined;
    const meta = (d.meta as Record<string, unknown> | undefined) ?? {};
    const buildingAt = (d.buildingAt as number | null) ?? null;
    const ready = (d.ready as number | null) ?? null;
    const durationMs =
      buildingAt && ready && ready > buildingAt ? ready - buildingAt : null;
    return {
      uid: d.id as string,
      url: (d.url as string) ?? "",
      readyState: (d.readyState as string) ?? "UNKNOWN",
      target: (d.target as string | null) ?? null,
      createdAt: (d.createdAt as number | null) ?? null,
      buildingAt,
      ready,
      durationMs,
      creatorUsername: (creator?.username as string | null) ?? null,
      gitRef:
        (meta.githubCommitRef as string | null) ??
        (meta.gitlabCommitRef as string | null) ??
        (meta.bitbucketCommitRef as string | null) ??
        null,
      gitSha:
        (meta.githubCommitSha as string | null) ??
        (meta.gitlabCommitSha as string | null) ??
        (meta.bitbucketCommitSha as string | null) ??
        null,
      gitMessage:
        (meta.githubCommitMessage as string | null) ??
        (meta.gitlabCommitMessage as string | null) ??
        (meta.bitbucketCommitMessage as string | null) ??
        null,
    };
  } catch (err) {
    console.warn(
      "[vercel] deployment detail threw",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Deployment stats — derived from getRecentDeployments(50)

export type DeploymentStats = {
  window: number; // how many deploys we considered
  total: number;
  production: number;
  successful: number;
  errors: number;
  successRatePct: number; // 0..100
  avgBuildSeconds: number | null;
  last7Days: number;
  last30Days: number;
};

export async function getDeploymentStats(): Promise<DeploymentStats> {
  const empty: DeploymentStats = {
    window: 0,
    total: 0,
    production: 0,
    successful: 0,
    errors: 0,
    successRatePct: 0,
    avgBuildSeconds: null,
    last7Days: 0,
    last30Days: 0,
  };
  if (!hasVercelConfig()) return empty;
  const deploys = await getRecentDeployments(50);
  if (deploys.length === 0) return empty;

  const total = deploys.length;
  const production = deploys.filter((d) => d.target === "production").length;
  const successful = deploys.filter((d) => d.state === "READY").length;
  const errors = deploys.filter((d) => d.state === "ERROR").length;
  const successRatePct =
    total > 0 ? Math.round((successful / total) * 100) : 0;

  const buildDurations = deploys
    .filter(
      (d) =>
        d.state === "READY" &&
        typeof d.buildingAt === "number" &&
        typeof d.ready === "number" &&
        d.ready > d.buildingAt,
    )
    .map((d) => (d.ready as number) - (d.buildingAt as number));
  const avgBuildSeconds =
    buildDurations.length > 0
      ? Math.round(
          buildDurations.reduce((a, b) => a + b, 0) /
            buildDurations.length /
            1000,
        )
      : null;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7Days = deploys.filter((d) => now - d.createdAt <= 7 * day).length;
  const last30Days = deploys.filter(
    (d) => now - d.createdAt <= 30 * day,
  ).length;

  return {
    window: total,
    total,
    production,
    successful,
    errors,
    successRatePct,
    avgBuildSeconds,
    last7Days,
    last30Days,
  };
}

// ───────────────────────────────────────────────────────────────
// Domains

export type DomainStatus =
  | "verified"
  | "misconfigured"
  | "pending"
  | "git-attached";

export type DomainInfo = {
  name: string;
  verified: boolean;
  gitBranch: string | null;
  redirect: string | null;
  redirectStatusCode: number | null;
  status: DomainStatus;
};

export async function getDomainsForProject(): Promise<DomainInfo[]> {
  if (!hasVercelConfig()) return [];
  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(PROJECT_NAME)}/domains${teamQuery("?")}`,
      {
        headers: authHeaders(),
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      console.warn("[vercel] domains fetch failed", res.status);
      return [];
    }
    const data = (await res.json()) as { domains?: Record<string, unknown>[] };
    return (data.domains ?? []).map((d) => {
      const name = d.name as string;
      const verified = Boolean(d.verified);
      const gitBranch = (d.gitBranch as string | null) ?? null;
      const redirect = (d.redirect as string | null) ?? null;
      const redirectStatusCode =
        (d.redirectStatusCode as number | null) ?? null;
      const status: DomainStatus = !verified
        ? "misconfigured"
        : gitBranch
          ? "git-attached"
          : "verified";
      return {
        name,
        verified,
        gitBranch,
        redirect,
        redirectStatusCode,
        status,
      };
    });
  } catch (err) {
    console.warn(
      "[vercel] domains fetch threw",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

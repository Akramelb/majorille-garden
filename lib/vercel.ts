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

export type DeploymentSummary = {
  uid: string;
  url: string;
  state: string; // READY | BUILDING | ERROR | CANCELED | QUEUED
  target: string | null; // production | staging | null
  createdAt: number;
  inspectorUrl?: string;
  meta?: {
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubCommitSha?: string;
  };
};

/**
 * Recent deployments via Vercel REST API. Returns [] if no token is set or the
 * call fails — the dashboard renders a "Connect Vercel" CTA in either case.
 * Requires a token with `Deployments: Read` scope.
 */
export async function getRecentDeployments(
  limit = 5,
): Promise<DeploymentSummary[]> {
  if (!hasVercelApiToken()) return [];
  try {
    // teamId is needed when the project lives under a team scope.
    const teamQ = process.env.VERCEL_TEAM_ID
      ? `&teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
      : "";
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?app=${PROJECT_NAME}&limit=${limit}&target=production${teamQ}`,
      {
        headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
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

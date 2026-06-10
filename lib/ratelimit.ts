import "server-only";
import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function make(
  prefix: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: false,
  });
}

const limiters = {
  contact: make("rl:contact", 5, "1 h"),
  newsletter: make("rl:news", 5, "1 h"),
  review: make("rl:review", 3, "1 h"),
  payment: make("rl:pay", 10, "1 h"),
  webhook: make("rl:webhook", 60, "1 m"),
  otp: make("rl:otp", 3, "10 m"),
  // Inbound email webhook — generous: forwarded threads + provider batching.
  inbound: make("rl:inbound", 120, "1 m"),
};

export type LimitName = keyof typeof limiters;

export async function checkRateLimit(
  name: LimitName,
): Promise<{ ok: boolean; reason?: string }> {
  const limiter = limiters[name];
  // Fail-open when Upstash env is missing — dev-friendly. Production must set
  // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to actually limit.
  if (!limiter) return { ok: true };
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  try {
    const { success } = await limiter.limit(`${name}:${ip}`);
    return success ? { ok: true } : { ok: false, reason: "rate-limited" };
  } catch (err) {
    // Fail-open on Upstash errors (NOPERM, network, etc.) — better to serve
    // unprotected than to 500 the request. Logs once per process for ops.
    console.warn(`[ratelimit:${name}] upstash error, failing open:`, err);
    return { ok: true };
  }
}

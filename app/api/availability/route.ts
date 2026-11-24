import { NextResponse } from "next/server";
import { SERVICES, SITE } from "@/lib/content";
import { checkRateLimit } from "@/lib/ratelimit";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const AUDIENCES = ["women", "men"] as const;
const MAX_MONTHS_AHEAD = 3;
const TZ = "Europe/Amsterdam";

function amsterdamMonthIndex(): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  return y * 12 + (m - 1);
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Read-only availability for the booking page. Proxies Cal.com's public
 * GET /v2/slots (no API key) and returns only "HH:MM" Amsterdam times per day.
 * Never creates a booking.
 */
export async function GET(request: Request) {
  if (!SITE.bookingConfigured) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }

  const rl = await checkRateLimit("availability");
  if (!rl.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const sp = new URL(request.url).searchParams;
  const serviceSlug = sp.get("service") ?? "";
  const audience = sp.get("audience") ?? "";
  const month = sp.get("month") ?? "";

  const service = SERVICES.find((s) => s.slug === serviceSlug);
  if (!service) return bad("service");
  if (!(AUDIENCES as readonly string[]).includes(audience)) return bad("audience");
  const match = MONTH_RE.exec(month);
  if (!match) return bad("month");

  const year = Number(match[1]);
  const mon = Number(match[2]);
  const offset = year * 12 + (mon - 1) - amsterdamMonthIndex();
  if (offset < 0 || offset > MAX_MONTHS_AHEAD) return bad("month-range");

  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const start = `${month}-01`;
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("username", SITE.calUsername);
  url.searchParams.set("eventTypeSlug", `${service.bookingSlug}-${audience}`);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("timeZone", TZ);

  try {
    const res = await fetch(url, {
      headers: { "cal-api-version": "2024-09-04" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    const json = (await res.json()) as {
      data?: Record<string, Array<{ start?: string }>>;
    };
    const days: Record<string, string[]> = {};
    for (const [day, slots] of Object.entries(json.data ?? {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Array.isArray(slots)) continue;
      const times = slots
        .map((s) => (typeof s.start === "string" ? s.start.slice(11, 16) : ""))
        .filter((t) => /^\d{2}:\d{2}$/.test(t));
      if (times.length) days[day] = times;
    }
    return NextResponse.json(
      { days },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SITE, type Audience } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";

const MAX_MONTHS_AHEAD = 3;
const TZ = "Europe/Amsterdam";

type Result =
  | { key: string; days: Record<string, string[]>; error?: undefined }
  | { key: string; error: true; days?: undefined };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayInAmsterdam(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Merge sorted "HH:MM" start times into [first, last] ranges. Consecutive
 * times join when their gap equals the smallest gap in the list.
 */
export function toRanges(times: string[]): Array<[string, string]> {
  if (times.length === 0) return [];
  let step = Infinity;
  for (let i = 1; i < times.length; i++) {
    step = Math.min(step, toMinutes(times[i]) - toMinutes(times[i - 1]));
  }
  const ranges: Array<[string, string]> = [];
  let start = times[0];
  let prev = times[0];
  for (let i = 1; i < times.length; i++) {
    if (toMinutes(times[i]) - toMinutes(prev) !== step) {
      ranges.push([start, prev]);
      start = times[i];
    }
    prev = times[i];
  }
  ranges.push([start, prev]);
  return ranges;
}

/**
 * Read-only availability calendar. Renders free days/times from
 * /api/availability. Nothing here is a link or a booking control: the guest
 * picks the real slot on the return page after payment.
 */
export function AvailabilityCalendar({
  serviceSlug,
  audience,
  locale,
}: {
  serviceSlug: string;
  audience: Audience;
  locale: Locale;
}) {
  const nl = locale === "nl";
  const today = useMemo(() => todayInAmsterdam(), []);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // Month being shown, derived from the offset.
  const monthIndex = today.y * 12 + (today.m - 1) + offset;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  const monthKey = `${year}-${pad(month)}`;
  const requestKey = `${serviceSlug}|${audience}|${monthKey}`;

  // Refetch on service / audience / month change; abort the stale request.
  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams({
      service: serviceSlug,
      audience,
      month: monthKey,
    });
    fetch(`/api/availability?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { days: Record<string, string[]> };
        setResult({ key: requestKey, days: json.days ?? {} });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult({ key: requestKey, error: true });
      });
    return () => controller.abort();
  }, [serviceSlug, audience, monthKey, requestKey]);

  const current = result?.key === requestKey ? result : null;
  const loading = current === null;
  const days = current?.days ?? {};

  const dateLocale = nl ? "nl-NL" : "en-GB";
  const monthLabel = new Intl.DateTimeFormat(dateLocale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  // Monday-first weekday headers (2024-01-01 is a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(dateLocale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const todayKey = `${today.y}-${pad(today.m)}-${pad(today.d)}`;

  const selectedTimes = selected ? (days[selected] ?? []) : [];

  function changeMonth(delta: number) {
    setOffset((o) => o + delta);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={offset === 0}
          aria-label={nl ? "Vorige maand" : "Previous month"}
          className="p-2 border border-border text-deep-brown hover:border-deep-brown disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <p className="serif text-base text-deep-brown capitalize" aria-live="polite">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={offset >= MAX_MONTHS_AHEAD}
          aria-label={nl ? "Volgende maand" : "Next month"}
          className="p-2 border border-border text-deep-brown hover:border-deep-brown disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {current?.error ? (
        <div
          role="alert"
          className="border border-terracotta/40 bg-terracotta/5 p-4 text-sm text-deep-brown"
        >
          <p className="mb-2">
            {nl
              ? "De beschikbaarheid kan nu niet worden geladen. Bel of mail ons gerust."
              : "We cannot load availability right now. Please call or email us."}
          </p>
          <p>
            <a href={SITE.phoneLink} className="underline">
              {SITE.phone}
            </a>
            {" · "}
            <a href={`mailto:${SITE.email}`} className="underline">
              {SITE.email}
            </a>
          </p>
        </div>
      ) : (
        <div aria-busy={loading}>
          <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[0.7rem] uppercase tracking-[0.12em] text-muted">
            {weekdays.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className={clsx("grid grid-cols-7 gap-1", loading && "opacity-50")}>
            {Array.from({ length: leading }, (_, i) => (
              <span key={`pad-${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = `${monthKey}-${pad(day)}`;
              const past = key < todayKey;
              const free = !past && !loading && (days[key]?.length ?? 0) > 0;
              const label = new Intl.DateTimeFormat(dateLocale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(Date.UTC(year, month - 1, day)));
              const status = free ? (nl ? "vrij" : "free") : nl ? "vol" : "full";
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!free}
                  onClick={() => setSelected(selected === key ? null : key)}
                  aria-label={`${label}, ${status}`}
                  aria-pressed={selected === key}
                  className={clsx(
                    "aspect-square text-sm border transition-all",
                    selected === key
                      ? "bg-deep-brown border-deep-brown text-cream"
                      : free
                        ? "bg-terracotta/10 border-terracotta text-deep-brown font-medium hover:bg-terracotta hover:text-cream"
                        : "border-transparent text-muted/50 cursor-not-allowed",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {loading ? (nl ? "Laden…" : "Loading…") : ""}
          </p>
        </div>
      )}

      {selected && selectedTimes.length > 0 && (
        <p className="text-sm text-deep-brown">
          <span className="text-muted">
            {nl ? "Vrije starttijden: " : "Free start times: "}
          </span>
          {toRanges(selectedTimes)
            .map(([a, b]) => (a === b ? a : `${a} ${nl ? "tot" : "to"} ${b}`))
            .join(", ")}
        </p>
      )}
    </div>
  );
}

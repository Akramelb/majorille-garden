/**
 * The salon's wall-clock timezone.
 *
 * Every user-facing date/time must be formatted with this. The app runs on
 * Vercel, whose runtime timezone is UTC, so an implicit format renders 1–2
 * hours behind Amsterdam — which silently lands on the wrong calendar day
 * (and the wrong greeting) around midnight. Client components need it too:
 * without it, SSR (UTC) and hydration (visitor's zone) disagree.
 *
 * Deliberately dependency-free so client bundles can import it without
 * pulling in `lib/content`.
 */
export const TIME_ZONE = "Europe/Amsterdam";

/**
 * Current hour (0–23) in Amsterdam, whatever the server's timezone is.
 * `Date#getHours()` reads the runtime zone and is wrong on Vercel.
 */
export function amsterdamHour(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      hour: "numeric",
    }).format(now),
  );
}

/**
 * `YYYY-MM-DD` for an instant as seen in Amsterdam. Use this to bucket things
 * by calendar day — `Date#getFullYear()/getMonth()/getDate()` read the runtime
 * zone and put late-evening Amsterdam events on the previous day under UTC.
 * `en-CA` is the locale whose numeric format is ISO-ordered.
 */
export function amsterdamDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

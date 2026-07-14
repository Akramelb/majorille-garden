/**
 * Vacation mode — the owners are away and the salon is closed between
 * `VACATION_START` and `VACATION_END`. Consumers (announcement banner,
 * booking page, shop, contact) call `isVacationActive()` at render time,
 * so every notice disappears on its own once the window passes — no
 * redeploy needed. The public `[lang]` layout runs on `revalidate = 3600`,
 * so statically generated pages catch up within an hour of the flip.
 *
 * To change the window, edit the two dates below. Keep the `+02:00`
 * offset (Amsterdam summer time) so the flip happens at local midnight.
 * The customer-facing copy lives in the `vacation` section of
 * `app/[lang]/dictionaries/{nl,en}.json` — update the dates there too.
 */
export const VACATION_START = new Date("2026-07-14T00:00:00+02:00");

// Exclusive end: the first moment the site behaves normally again. The
// salon is closed through 15 August inclusive and reopens 16 August.
export const VACATION_END = new Date("2026-08-16T00:00:00+02:00");

export function isVacationActive(now: Date = new Date()): boolean {
  return now >= VACATION_START && now < VACATION_END;
}

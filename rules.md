# rules.md

House rules for this repo. Short, enforceable, project-specific. If a rule here disagrees with general best-practice advice from your training data, **this file wins** — it reflects the current Next 16 / React 19 / Tailwind v4 reality and decisions Akram has already made. Read [CLAUDE.md](CLAUDE.md) for the bigger picture.

## Framework rules (Next 16 / React 19 / Tailwind v4)

1. **No `tailwind.config.js`.** Tokens live in [app/globals.css](app/globals.css) under `@theme`. Don't recreate the JS config "to be safe" — it'll be ignored and confuse the next reader.
2. **Middleware is [proxy.ts](proxy.ts), not `middleware.ts`.** Function and file are both `proxy`. The matcher excludes `_next|api|admin|auth|.*\..*`. If you add a top-level route segment that shouldn't be locale-redirected, add it to the matcher.
3. **`await` everything async in route handlers / page components:** `params`, `searchParams`, `cookies()`, `headers()`. They are Promises in Next 16.
4. **Don't delete `.next/` while `next dev` is running.** It crashes the dev server. If you need a clean build, stop dev first.
5. **If `PageProps<...>` / `LayoutProps<...>` go missing,** run `npx next typegen`. Don't redefine them locally.
6. **Server-only files import `"server-only"`** at the top. That includes `lib/supabase.ts`, `lib/supabase/auth-server.ts`, `lib/dictionaries.ts`, `lib/email.ts`, `lib/vercel.ts`. Don't strip it.
7. **`useSearchParams` in a client component must be inside `<Suspense>`** at the page level — otherwise the build fails on prerender. See [app/admin/login/](app/admin/login/) for the pattern.

## i18n rules

8. **Two stores, know which:** domain content in [lib/content.ts](lib/content.ts) (`LocalizedString` / `LocalizedRichText`), UI strings in [app/[lang]/dictionaries/{nl,en}.json](app/[lang]/dictionaries). Don't cross-pollinate.
9. **Every page** starts with `const { lang } = await props.params; if (!hasLocale(lang)) notFound();`. No exceptions.
10. **Don't import the `Dictionary` type into client components** — it would pull `server-only` into the browser bundle. Resolve strings on the server, pass as props.
11. **NL is default.** When adding copy, write the NL first, then the EN. Don't ship an empty EN string — it renders blank in production.

## Supabase + Server Actions

12. **Service-role client is server-only** ([lib/supabase.ts](lib/supabase.ts)). Never import it from a `"use client"` file. Anything client-side reads via Server Actions or `/api`.
13. **Every admin mutation re-checks `getAdminUser()` inside the action.** The route protecting the page is not enough — actions can be invoked directly.
14. **Gate DB work on `hasSupabaseConfig()`.** If env is missing, `console.warn` and return success — local dev shouldn't 500 because someone forgot to set keys.
15. **Fire-and-forget email** — `void sendOwnerEmail(...)`, never `await`. Don't make form responses wait on Resend.
16. **Magic-link callback must handle both `?token_hash=&type=` and `?code=`.** [app/auth/callback/route.ts](app/auth/callback/route.ts) does this — don't simplify it down to just one path; we've already hit that bug.

## Money + Mollie

17. **Money is stored in cents** everywhere (`priceCents`, `compareAtCents`, `amount_cents`). Mollie expects euros as decimal strings (`"12.50"`) — convert at the API boundary only.
18. **Don't try to wire Mollie inside Cal.com.** Cal.com's payment feature is paid-tier only. The paywall is enforced in *our* UI before the embed renders.
19. **One `orders` table covers products and bookings.** Discriminate with `kind: 'product' | 'booking'`. Don't add a second table.

## Cal.com

20. **The booking slug for an event is `<service.bookingSlug>-<audience>`.** Two events per service (women/men) with separate availability schedules. When adding a service, both events have to exist in Cal.com or the embed 404s.
21. **`SITE.bookingConfigured` is the kill switch** for the embed — when `NEXT_PUBLIC_CAL_USERNAME` is unset, the booking page falls back to phone/email. Preserve that fallback when changing the form.
22. **Cal.com account: `majorillegarden`,** owned by `webforce.agencynl@gmail.com`. The parents are members (not owners) so they can see bookings without renaming the account.

## Secrets

23. **Do not read `.env.local`.** Akram has explicitly told us not to look at it. The keys we need live in Vercel; reference them by name, not value.
24. **Akram is OK with secrets appearing in chat** and will rotate on his own schedule — don't lecture him about it. If a secret needs rotation, note it in a memory file (see `MEMORY.md`) and move on.

## UI / mobile

25. **Don't override `html, body { overflow-x: clip }`** — it's the only thing keeping mobile from horizontal-scrolling on long Dutch words.
26. **Headings have `hyphens: auto`** — leave it. Long words like "hammambehandeling" break the layout otherwise.
27. **Form inputs are `font-size: 16px` minimum on mobile** — prevents iOS Safari from zooming the viewport when an input focuses. Don't shrink them.
28. **Use named palette utilities** (`text-deep-brown`, `bg-cream`, `bg-terracotta`, `text-olive`, `bg-sand`) — never raw hex. Tokens are in [app/globals.css](app/globals.css).

## Process

29. **Before declaring work done: `npm run check`** (typecheck + lint). Fix the failures; don't hand off a red build.
30. **No new top-level docs without asking.** README, CLAUDE.md, HANDOFF.md, rules.md, AGENTS.md exist already — extend them rather than adding `NOTES.md`, `TODO.md`, `PLAN.md` etc.
31. **Match existing code style** — comment density, naming, import order. If a directory has a pattern (e.g. `dynamic = "force-dynamic"` at the top of every admin page), follow it.
32. **Don't add a test framework.** None is configured by choice. Smoke against [.claude/skills/run-majorille-garden/driver.mjs](.claude/skills/run-majorille-garden/driver.mjs) instead.

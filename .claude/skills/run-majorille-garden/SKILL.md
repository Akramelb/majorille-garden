---
name: run-majorille-garden
description: Build, run, and smoke-test the Majorille Garden website (Next.js 16 marketing site). Use when asked to run, start, build, serve, test, smoke-test, or verify the Majorille Garden app, or check that its routes / i18n / booking / SEO render.
---

Majorille Garden is a bilingual (NL/EN) Next.js 16 + Tailwind v4 marketing site. It's a server-rendered web app — you drive it by starting the dev server and running the **HTTP smoke driver** at `.claude/skills/run-majorille-garden/driver.mjs`, which asserts that every route returns the right status and that the rendered HTML contains the expected localized content, SEO tags, and booking UI. That HTTP layer is what changes to this content-driven site actually touch.

All paths below are relative to the project root (`majorille-garden/`).

> No `chromium-cli`/Playwright in this environment, so the harness is HTTP-level (status + rendered-HTML assertions), not pixel screenshots. For a server-rendered site this covers route rendering, i18n, structured data, and form wiring — the layers PRs here touch.

## Prerequisites

- Node 18+ (developed on v24). Uses global `fetch` and `AbortSignal.timeout` — no driver deps.
- npm. No OS packages needed (pure web app; no xvfb/browser).

## Build

```bash
npm install
```

Optional env (the app runs without any of it — see Gotchas): copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CAL_USERNAME`, `RESEND_API_KEY`.

Typecheck / production build (both pass clean):

```bash
npx tsc --noEmit
npm run build
```

> If `npx tsc --noEmit` reports `Cannot find name 'PageProps'`/`'LayoutProps'`, run `npx next typegen` first — those are generated route types (see Gotchas).

## Run (agent path) — start server, then drive it

Start the dev server in the background, then run the driver:

```bash
npm run dev          # serves http://localhost:3000 (redirects / → /nl)
node .claude/skills/run-majorille-garden/driver.mjs
```

The driver prints a pass/fail line per check and exits non-zero on any failure. Expected tail on a healthy build:

```
────────────────────────────────────────────────
All 20 checks passed.
```

It covers: locale redirect, NL/EN home, services index + detail (NL & EN) + 404, booking page + audience selector + deep-link, contact/shop/privacy/terms, JSON-LD, hreflang, sitemap.xml, robots.txt, OG image, favicon, and the `/admin → /admin/login` redirect.

If the dev server landed on a different port (e.g. 3001 because 3000 was busy), point the driver at it:

```bash
BASE_URL=http://localhost:3001 node .claude/skills/run-majorille-garden/driver.mjs
```

## Run (human path)

```bash
npm run dev
```

Open http://localhost:3000 — it redirects to `/nl`. English is at `/en`. This is the path for eyeballing the design; the driver above is the path for verifying it programmatically.

## Direct invocation (no server)

Most logic is static content + server components, so the build itself is the fastest correctness check:

```bash
npm run check     # tsc --noEmit && eslint
npm run build     # full production build + static generation of all 39 routes
```

## Gotchas (battle scars)

- **Middleware is `proxy.ts`, not `middleware.ts`** (Next 16 rename). The exported function is `proxy`. Its `config.matcher` excludes `_next`, `api`, `admin`, and dotted paths — `/admin` is intentionally outside locale rewriting.
- **`PageProps`/`LayoutProps` are generated, not imported.** `npx next dev`/`build`/`typegen` writes them into `.next/types`. After a clean (`rm -rf .next`), a bare `npx tsc --noEmit` fails with `Cannot find name 'PageProps'` until you run `npx next typegen` (or any dev/build).
- **Deleting `.next/` while `next dev` is running crashes the running server** — it starts erroring `Cannot find module '../chunks/ssr/[turbopack]_runtime.js'` and every route 500s. Fix: kill and restart the dev server. Don't `rm -rf .next` against a live dev server.
- **Env changes need a dev-server restart.** Next reads env at boot. After editing `.env.local` (e.g. adding `NEXT_PUBLIC_CAL_USERNAME`), restart `npm run dev` or the change won't apply.
- **Everything degrades gracefully without env vars.** No Supabase → contact/newsletter Server Actions `console.warn` and still return success (so the form "works" locally but nothing persists). No `NEXT_PUBLIC_CAL_USERNAME` → the booking page shows a call/email fallback instead of the Cal.com embed. No Resend → owner emails silently no-op. A green smoke run does **not** prove the integrations are wired — only that the UI renders.
- **`hreflang` renders as `hrefLang`** (camelCase) in the HTML string — that's React emitting the attribute literally; crawlers read it case-insensitively. Assert the camelCase spelling in HTML, not the spec spelling. (This bit the driver itself.)
- **Tailwind v4 is CSS-first.** Tokens (`--color-terracotta`, etc.) live in `app/globals.css` under `@theme`. There is no `tailwind.config.js`.
- **Dual-lockfile warning** (a stray `package-lock.json` higher up the tree) is silenced by `turbopack.root` in `next.config.ts`. Harmless if it reappears.
- **Bookings use Cal.com, not Calendly.** Per-audience event slugs `<bookingSlug>-women` / `<bookingSlug>-men`; the embed is `@calcom/embed-react`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Driver: `Cannot reach http://localhost:3000` | Start the server: `npm run dev`. Or it's on another port — use `BASE_URL=http://localhost:3001 …`. |
| Every route 500s in a previously-working dev server | You (or a build) wiped `.next/` under the running server. Kill it and `npm run dev` again. |
| `tsc` errors `Cannot find name 'PageProps'` | `npx next typegen` (regenerates `.next/types`). |
| Driver fails only on booking/Cal checks after you set a username | Restart the dev server so it re-reads `.env.local`. |

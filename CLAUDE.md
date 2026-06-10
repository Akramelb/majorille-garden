# CLAUDE.md

Guidance for Claude Code when working in this repository. Read this and [rules.md](rules.md) before writing code.

## Critical — read this before writing Next.js code

This project is on **Next.js 16.2** with **React 19** and **Tailwind v4**. APIs, file conventions, and config formats have breaking changes vs. older versions you may have seen in training data. Before writing or modifying anything framework-touching:

- Check `node_modules/next/dist/docs/` for the relevant Next 16 guide.
- Heed deprecation notices in source/comments.
- `cookies()`, `headers()`, `params`, and `searchParams` are **async** in Next 16 — `await` them.
- `PageProps<...>` and `LayoutProps<...>` are **generated globals**. If they go missing after deleting `.next/`, run `npx next typegen`.
- Tailwind v4 is **CSS-first**: tokens live in [app/globals.css](app/globals.css) under `@theme`, **not** a `tailwind.config.js`. There is no JS config file.
- Middleware lives in [proxy.ts](proxy.ts), not `middleware.ts` — the file and the exported function are both named `proxy`. The `config.matcher` excludes `_next`, `api`, `admin`, `auth`, and any path with a dot.

## Commands

```bash
npm run dev         # dev server on http://localhost:3000 (proxy redirects / → /nl or /en)
npm run build       # production build (Turbopack)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run check       # typecheck + lint (run this before declaring work done)
```

No test framework is configured. There is a smoke driver at [.claude/skills/run-majorille-garden/driver.mjs](.claude/skills/run-majorille-garden/driver.mjs) that hits ~20 routes against a running dev/prod server.

## Architecture

### Two-tier i18n (no next-intl)

Bilingual NL/EN via Next 16's native `app/[lang]` segment. NL is the default; English is picked via `Accept-Language` in [proxy.ts](proxy.ts). Content is split across two stores — know which to edit:

- **[lib/content.ts](lib/content.ts)** — domain content (services, products, FAQ fallback, testimonial, SITE info, about copy). Every translatable string is a `LocalizedString = Record<Locale, string>`; rich text is `LocalizedRichText = Record<Locale, string[]>` (paragraph arrays). Page components do `localized(field, lang)` to resolve. `localized` is generic — it works on any `Record<Locale, T>`, not just strings.
- **[app/[lang]/dictionaries/{nl,en}.json](app/[lang]/dictionaries)** — UI strings (button labels, headers, form copy). Loaded server-side only via [app/[lang]/dictionaries.ts](app/[lang]/dictionaries.ts), which exports `getDictionary`, `hasLocale`, `LOCALES`, and the `Locale` type. The dictionary file is `import "server-only"` — don't pull `Dictionary` into client components; pass resolved strings down as props.

Page components are async and start with `const { lang } = await props.params;` followed by `if (!hasLocale(lang)) notFound();` — preserve that pattern when adding routes.

### Services are data-driven

The 8 treatment detail pages are a single `[slug]` route ([app/[lang]/services/[slug]/page.tsx](app/[lang]/services/[slug]/page.tsx)) statically generated from the `SERVICES` array in [lib/content.ts](lib/content.ts). Adding a service = adding an entry to that array (with `slug`, `cardImage`, `heroImage`, `galleryImages`, `intro`, `sections`, `variants`, `bookingSlug`) — no new page file.

### Bookings — Cal.com (free tier) split by audience

Bookings use **Cal.com** (`@calcom/embed-react`), not Calendly. Each `Service.bookingSlug` is the base for **two** per-audience Cal.com event types: `<bookingSlug>-women` and `<bookingSlug>-men`, each on its own availability schedule (Women vs Men hours). `calLinkForService(service, audience)` in [lib/content.ts](lib/content.ts) builds the `<username>/<bookingSlug>-<audience>` calLink; the booking form falls back to a call/email block when `SITE.bookingConfigured` is false (i.e. `NEXT_PUBLIC_CAL_USERNAME` unset). See [HANDOFF.md §2](HANDOFF.md) for the slug ↔ event mapping. The Cal.com account is `majorillegarden`, owned by `webforce.agencynl@gmail.com`, with the parents added as members.

**Paywall (planned, Phase 3):** Cal.com's "require payment to book" feature is paid-tier only — we're on free. The plan is to gate the embed behind a Mollie payment ourselves: the booking page collects audience + service first, redirects to a Mollie checkout for a deposit (or full price), and only renders the Cal.com embed once the payment webhook flips the order to `paid`. The Cal.com `bookingSlug` stays the same; what changes is who's allowed to see the embed. See Phase 3 below — do **not** wire Mollie directly into Cal.com (no native integration on free tier); the gate has to be in our own UI + an `orders` table.

### Server Actions with graceful Supabase fallback

Form submissions (contact, newsletter, review submission) are React 19 Server Actions in [lib/actions.ts](lib/actions.ts). Admin-only mutations (publish blog post, moderate reviews, FAQ CRUD, reorder) live in [lib/admin-actions.ts](lib/admin-actions.ts) and re-check `getAdminUser()` on every call — never trust the client.

Both action files use the **service-role** Supabase client from [lib/supabase.ts](lib/supabase.ts) (server-only). User-session reads go through `@supabase/ssr` via [lib/supabase/auth-server.ts](lib/supabase/auth-server.ts) (`getAdminUser()` returns null unless the session email is in `ADMIN_EMAILS`).

`hasSupabaseConfig()` gates DB writes — if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unset, the action `console.warn`s and returns success so local dev doesn't break. Maintain this pattern for any new Server Action that touches Supabase: validate, attempt side effects, degrade gracefully when env is missing.

Owner email notifications ([lib/email.ts](lib/email.ts)) are fire-and-forget (`void sendOwnerEmail(...)`) and silently no-op without `RESEND_API_KEY` + `NOTIFY_TO`. Don't `await` them inside a Server Action — they shouldn't block form responses.

### Admin CMS (Phase 2 — shipped)

Magic-link auth via Supabase, allowlisted by `ADMIN_EMAILS` env. The callback handler at [app/auth/callback/route.ts](app/auth/callback/route.ts) handles **both** `?token_hash=&type=` (OTP) and `?code=` (PKCE) flows; [app/auth/confirm/route.ts](app/auth/confirm/route.ts) is a mirror that re-exports `{ GET }`. Login UI ([app/admin/login/](app/admin/login/)) is split into a server wrapper + a client `LoginForm` wrapped in `<Suspense>` because `useSearchParams` would otherwise break prerendering.

Admin UI shell ([components/admin/AdminShell.tsx](components/admin/AdminShell.tsx) + [AdminNav.tsx](components/admin/AdminNav.tsx)) provides the sidebar/drawer used by every `/admin/*` page. Sections:

- **Dashboard** ([app/admin/page.tsx](app/admin/page.tsx)) — greeting, 4 stat cards, Vercel deploys block (live, via [lib/vercel.ts](lib/vercel.ts) using `VERCEL_API_TOKEN` + `VERCEL_TEAM_ID`), recent contact submissions, newsletter subscriber chips.
- **Reviews** ([app/admin/reviews/](app/admin/reviews/)) — moderate `pending` → `approved`/`rejected`.
- **Journal/Blog** ([app/admin/blog/](app/admin/blog/)) — full CRUD on `blog_posts`, `react-markdown` body, cover image picker scanning `/public/images` via [lib/image-manifest.ts](lib/image-manifest.ts).
- **FAQ** ([app/admin/faq/](app/admin/faq/)) — CRUD + reorder; falls back to `FAQS` in [lib/content.ts](lib/content.ts) when the table is empty.

When adding admin pages, mirror the pattern: `export const dynamic = "force-dynamic"`, `const user = await getAdminUser(); if (!user) redirect("/admin/login");`, then render inside `<AdminShell userEmail={user.email ?? null}><AdminPage title="...">`.

### Assets

Photos live under `public/images/<section>/...`. Service galleries follow `public/images/services/<dutch-slug>/{card,hero,01,02,...}.jpg`. The Dutch slug in the folder name (e.g. `warme-zandbad`, `bio-head-spa`) is the disk path; the route slug used in URLs can differ (it's whatever's set in `SERVICES[].slug`). When swapping images, replace the file at the same path — `lib/content.ts` references the path string. Blog cover picker scans `/public/images` at request time, so new files appear without a redeploy.

## Conventions worth preserving

- Path alias `@/*` maps to repo root (see [tsconfig.json](tsconfig.json)) — prefer `@/lib/...` over relative `../../lib/...`.
- Server-only modules import `"server-only"` at the top (dictionaries, supabase service-role client). Keep that guard.
- Money is stored in **cents** (`priceCents`, `compareAtCents`); format at the render boundary. Mollie expects euros as decimal strings (`"12.50"`) — convert at the API boundary, not in storage.
- The Moroccan-inspired palette (terracotta / sand / olive / deep-brown / cream) is defined as Tailwind tokens in `globals.css` — use the named utilities (`text-deep-brown`, `bg-cream`) rather than hex literals.
- Display type is Fraunces (`.display`, `.serif`), body is Inter — both loaded via `next/font/google` in [app/[lang]/layout.tsx](app/[lang]/layout.tsx). `<Analytics />` + `<SpeedInsights />` from Vercel are mounted in the root layout.
- Mobile safeguards: `html, body { overflow-x: clip }`; headings get `hyphens: auto`; form inputs are forced to `font-size: 16px` to suppress iOS zoom-on-focus. Don't override without thinking.
- **Canonical host:** any URL leaving the server (Supabase magic-link `emailRedirectTo`, Mollie return/webhook URLs, JSON-LD, OG meta) is derived from `siteUrl()` in [lib/seo.ts](lib/seo.ts) — never from request headers. Header-derived URLs land users on `*.vercel.app` previews where the cookie domain mismatches and the session breaks. Supabase dashboard's Site URL must match `siteUrl()` exactly or it silently rewrites the link.

## Phased roadmap

### Phase 1 — shipped

- Bilingual marketing site, 8 service pages, contact + newsletter Server Actions, review-submission flow, SEO/JSON-LD, cookie banner, OG images, legal pages ([lib/legal.ts](lib/legal.ts)).
- **Cal.com bookings** — inline embed at [app/[lang]/booking/page.tsx](app/[lang]/booking/page.tsx) via [components/sections/BookingForm.tsx](components/sections/BookingForm.tsx), deep-linked per treatment + audience. Free tier, no payment at this stage.
- **Resend owner notifications** — wired into contact + review Server Actions; auto-activates when `RESEND_API_KEY` + `NOTIFY_TO` are set.
- **Vercel analytics + Speed Insights** — instrumented in the public root layout.

### Phase 2 — Admin CMS (shipped)

Magic-link auth, dashboard with live Vercel deploys + stats, reviews moderation, full blog CRUD, FAQ CRUD with reorder. Source of truth for FAQs/blog/reviews is Supabase; services + products still live in [lib/content.ts](lib/content.ts) (intentional — owners don't edit those yet). When adding new admin features, follow the patterns in [lib/admin-actions.ts](lib/admin-actions.ts) (re-check `getAdminUser()` inside the action) and [components/admin/](components/admin/) (shell + page wrapper).

### Phase 3 — Mollie checkout + booking paywall (shipped)

Live on production. Real e-commerce for the shop and full-price paywall in front of Cal.com bookings, both backed by a single `orders` table.

- **Shop checkout** — Buy Now flow on [app/[lang]/shop/page.tsx](app/[lang]/shop/page.tsx) via [lib/shop-actions.ts](lib/shop-actions.ts) (`createShopPayment`). Mollie iDEAL + card, NL-only shipping address collected client-side, `line_items` stored as JSONB.
- **Booking paywall** — [components/sections/BookingForm.tsx](components/sections/BookingForm.tsx) collects service + audience, [lib/booking-actions.ts](lib/booking-actions.ts) (`createBookingPayment`) creates a Mollie payment for `Service.variants[0].priceCents`, signs a return token via HMAC, redirects to Mollie checkout. The return page [app/[lang]/booking/return/page.tsx](app/[lang]/booking/return/page.tsx) verifies the token, polls until the webhook flips `status` to `paid`, then renders the Cal.com embed. Cal.com bookings are reconciled to the order by `customer_email + service` in [app/admin/orders/](app/admin/orders/) — no UUID is injected into Cal.com notes.
- **Webhook** — [app/api/mollie/webhook/route.ts](app/api/mollie/webhook/route.ts) with content-type guard → rate-limit → local-lookup-before-SDK-fetch ordering. Always returns 200 to avoid Mollie's 24h retry storm. Atomic status flip via `updateOrderStatusIfChanged` so duplicate webhooks can't re-fire emails.
- **Data model** — single `orders` table: `kind: 'product' | 'booking'`, `mollie_payment_id`, `status`, `amount_cents`, `service_slug` + `audience` + `booking_slug` (booking), `line_items` JSONB (product), `shipping_address` JSONB. Schema in [HANDOFF.md](HANDOFF.md).
- **Money rules** — `Product.priceCents` / `Service.variants[].priceCents` always cents; `lib/mollie.ts:centsToEuroString()` converts at the API boundary.
- **Money rules** — `Product.priceCents` / `Service.variants[].priceCents` always cents; `lib/mollie.ts:centsToEuroString()` converts at the API boundary. Refunds via [lib/admin-actions.ts](lib/admin-actions.ts) `refundOrder()`.
- **Env** — `MOLLIE_API_KEY` (live), `ORDER_TOKEN_SECRET` (HMAC), `NEXT_PUBLIC_SITE_URL` (return + webhook URLs — MUST be the custom domain, never `*.vercel.app`).

## More context

- [rules.md](rules.md) — short, enforceable house rules (what not to do).
- [README.md](README.md) — stack, Supabase SQL setup, Cal.com setup, Vercel deploy, content-editing locations.
- [HANDOFF.md](HANDOFF.md) — owner action items (Supabase, Cal.com, Resend, domain cutover) and shipped vs. deferred status.
- [.claude/skills/run-majorille-garden/SKILL.md](.claude/skills/run-majorille-garden/SKILL.md) — how to launch + smoke-test the app from a fresh checkout.

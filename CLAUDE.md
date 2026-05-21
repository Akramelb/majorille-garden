# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical — read this before writing Next.js code

This project is on **Next.js 16.2** with **React 19** and **Tailwind v4**. APIs, file conventions, and config formats have breaking changes vs. older versions you may have seen in training data. Before writing or modifying anything framework-touching:

- Check `node_modules/next/dist/docs/` for the relevant Next 16 guide.
- Heed deprecation notices in source/comments.
- Tailwind v4 is **CSS-first**: tokens live in [app/globals.css](app/globals.css) under `@theme`, **not** a `tailwind.config.js`. There is no JS config file.
- Middleware lives in [proxy.ts](proxy.ts), not `middleware.ts` — the file and the exported function are both named `proxy`. The `config.matcher` excludes `_next`, `api`, `admin`, and any path with a dot.

## Commands

```bash
npm run dev         # dev server on http://localhost:3000 (proxy redirects / → /nl or /en)
npm run build       # production build (Turbopack)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run check       # typecheck + lint (run this before declaring work done)
```

No test framework is configured.

## Architecture

### Two-tier i18n (no next-intl)

Bilingual NL/EN via Next 16's native `app/[lang]` segment. NL is the default; English is picked via `Accept-Language` in [proxy.ts](proxy.ts). Content is split across two stores — know which to edit:

- **[lib/content.ts](lib/content.ts)** — domain content (services, products, FAQ, testimonial, SITE info, about copy). Every translatable string is a `LocalizedString = Record<Locale, string>`; rich text is `LocalizedRichText = Record<Locale, string[]>` (paragraph arrays). Page components do `localized(field, lang)` to resolve.
- **[app/[lang]/dictionaries/{nl,en}.json](app/[lang]/dictionaries)** — UI strings (button labels, headers, form copy). Loaded server-side only via [app/[lang]/dictionaries.ts](app/[lang]/dictionaries.ts), which exports `getDictionary`, `hasLocale`, `LOCALES`, and the `Locale` type. The dictionary file is `import "server-only"` — don't pull `Dictionary` into client components; pass resolved strings down as props.

Page components are async and start with `const { lang } = await props.params;` followed by `if (!hasLocale(lang)) notFound();` — preserve that pattern when adding routes.

### Services are data-driven

The 8 treatment detail pages are a single `[slug]` route ([app/[lang]/services/[slug]/page.tsx](app/[lang]/services/[slug]/page.tsx)) statically generated from the `SERVICES` array in [lib/content.ts](lib/content.ts). Adding a service = adding an entry to that array (with `slug`, `cardImage`, `heroImage`, `galleryImages`, `intro`, `sections`, `variants`, `bookingSlug`) — no new page file.

Bookings use **Cal.com** (`@calcom/embed-react`), not Calendly. Each `Service.bookingSlug` is the base for two per-audience Cal.com event types: `<bookingSlug>-women` and `<bookingSlug>-men`, each on its own availability schedule (Women vs Men hours). `calLinkForService(service, audience)` in [lib/content.ts](lib/content.ts) builds the `<username>/<bookingSlug>-<audience>` calLink; the booking form falls back to a call/email block when `SITE.bookingConfigured` is false (i.e. `NEXT_PUBLIC_CAL_USERNAME` unset). See [HANDOFF.md](HANDOFF.md) §2 for the slug ↔ event mapping.

### Server Actions with graceful Supabase fallback

Form submissions (contact, newsletter) are React 19 Server Actions in [lib/actions.ts](lib/actions.ts). They use the **service-role** Supabase client from [lib/supabase.ts](lib/supabase.ts) (server-only).

`hasSupabaseConfig()` gates the DB write — if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unset, the action `console.warn`s and returns success so local dev doesn't break. Maintain this pattern for any new Server Action that touches Supabase: do the validation, attempt side effects, and degrade gracefully when env is missing.

Owner email notifications (`lib/email.ts`) are fire-and-forget (`void sendOwnerEmail(...)`) and silently no-op without `RESEND_API_KEY` + `NOTIFY_TO`. Don't `await` them inside a Server Action — they shouldn't block form responses.

### Assets

Photos live under `public/images/<section>/...`. Service galleries follow `public/images/services/<dutch-slug>/{card,hero,01,02,...}.jpg`. The Dutch slug in the folder name (e.g. `warme-zandbad`, `bio-head-spa`) is the disk path; the route slug used in URLs can differ (it's whatever's set in `SERVICES[].slug`). When swapping images, replace the file at the same path — `lib/content.ts` references the path string.

### Admin scaffold

`/admin` and `/admin/login` exist as Phase-2 placeholders — UI only, no auth, no Supabase wiring yet. Don't assume admin features work. The `proxy.ts` matcher already excludes `/admin` from locale redirection.

## Conventions worth preserving

- Path alias `@/*` maps to repo root (see [tsconfig.json](tsconfig.json)) — prefer `@/lib/...` over relative `../../lib/...`.
- Server-only modules import `"server-only"` at the top (dictionaries, supabase client). Keep that guard.
- Money is stored in cents (`priceCents`); format at the render boundary.
- The Moroccan-inspired palette (terracotta / sand / olive / deep-brown / cream) is defined as Tailwind tokens in `globals.css` — use the named utilities (`text-deep-brown`, `bg-cream`) rather than hex literals.
- Display type is Fraunces (`.display`, `.serif`), body is Inter — both loaded via `next/font/google` in [app/[lang]/layout.tsx](app/[lang]/layout.tsx).

## Phased roadmap (what's built vs. coming)

The codebase is structured around three delivery phases. Know which phase a feature belongs to before adding code — half-built scaffolds for later phases already exist and shouldn't be treated as broken.

### Phase 1 — shipped

- Bilingual marketing site, 8 service pages, contact + newsletter Server Actions, SEO/JSON-LD, cookie banner, OG images.
- **Cal.com bookings** — inline embed (`@calcom/embed-react`) at [app/[lang]/booking/page.tsx](app/[lang]/booking/page.tsx) via [components/sections/BookingForm.tsx](components/sections/BookingForm.tsx), deep-linked per treatment + audience via `Service.bookingSlug` and `calLinkForService` (see [HANDOFF.md §2](HANDOFF.md) for slug mapping). No payment in this flow — Cal.com only schedules.
- **Resend owner notifications** — wired into the contact Server Action ([lib/email.ts](lib/email.ts), [lib/actions.ts](lib/actions.ts)); auto-activates when `RESEND_API_KEY` + `NOTIFY_TO` are set.

### Phase 2 — Admin CMS (scaffold only)

Goal: let the owners edit prices, copy, gallery, and read submissions without redeploying. **Currently scaffold only — do not assume it works.**

- [app/admin/](app/admin/) and [app/admin/login/](app/admin/login/) — UI placeholders, no auth, no Supabase wiring.
- `proxy.ts` already excludes `/admin` from locale redirection — don't re-add it to the matcher.
- Planned: Supabase magic-link auth, dashboard reading `contact_submissions` + `newsletter_subscribers`, edit forms that mutate a `services` table (currently `lib/content.ts` is the source of truth; Phase 2 will likely move it to Supabase or keep it as fallback).
- When building Phase 2, the dual-source question (file-based `SERVICES` vs. DB rows) needs resolving up front — don't half-migrate.

### Phase 3 — Mollie checkout (not started)

Goal: real e-commerce for the shop ([app/[lang]/shop/page.tsx](app/[lang]/shop/page.tsx)). **Nothing built yet — the shop page is catalog-only.**

- Planned: Mollie iDEAL + card checkout, order management in `/admin`, order-confirmation emails via the existing Resend integration in [lib/email.ts](lib/email.ts).
- `Product.priceCents` and `compareAtCents` are already in the type ([lib/content.ts](lib/content.ts)) — Mollie expects cents too, so no conversion needed at integration time.
- Booking flow stays on Cal.com; Mollie is for product purchases only unless scope changes.

## More context

- [README.md](README.md) — stack, Supabase SQL setup, Cal.com setup, Vercel deploy, content-editing locations.
- [HANDOFF.md](HANDOFF.md) — owner action items (Supabase project, Cal.com events, Resend, domain cutover) and what's already shipped vs. deferred to Phase 2/3.

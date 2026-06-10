# Performance · Security · SEO Audit — Majorille Garden

**Date:** 2026-06-10 · **Scope:** full public site + API routes + config (commit base: `master` @ 4eb5efd)
**Status legend:** ✅ fixed in this patch · 🔶 recommended (not applied) · ⚪ checked, no action needed

> Note: `psi-home-before.json` / `psi-service-before.json` in the parent folder both contain
> PageSpeed API *quota-exceeded* errors — there is no usable Lighthouse baseline to compare against.
> Re-run PSI after deploying this patch to establish one.

---

## 1. Performance

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| P1 | High | `public/images` weighed **27 MB**; `kruidenstempel/card.jpg` and `hero.jpg` were **4.6 MB each**, five PNG photos 1.2–2.5 MB. Even with `next/image`, the optimizer must fetch and transcode these giants on every cold cache. | ✅ Recompressed every image > 500 KB in place (mozjpeg q78 / palette PNG q82, width capped at 2400px). **27 MB → 11 MB (−12.2 MB)**; largest file now 932 KB. Originals preserved in `image-backups/optim-2026-06-10/`. PNG paths kept intact because production blog covers reference them (e.g. `bio-head-spa/hero.png`). |
| P2 | High | The home page made **3 identical Supabase round-trips** per request for the same `site_settings` row (layout announcement + two hero slots). | ✅ `getSiteSettings()` wrapped in React `cache()` ([lib/site-settings.ts](lib/site-settings.ts)) — one read per request, all consumers share it. |
| P3 | High | `getReviewStats()` fetched up to **1000 full review rows** just to compute count/average — and the home page *also* fetched reviews separately, so the table was scanned twice. | ✅ Stats query now selects only the `rating` column ([lib/reviews.ts](lib/reviews.ts)). |
| P4 | High | `force-dynamic` on `/reviews`, `/journal`, `/journal/[slug]` made every page view hit Supabase with zero caching. | ✅ Replaced with `revalidate = 300` (ISR). Admin publishes/moderation now appear within 5 minutes instead of instantly — acceptable trade-off; lower it if that ever bites. |
| P5 | Med | `unoptimized={src.startsWith("http")}` on hero/about images disabled Next image optimization entirely for admin-uploaded Supabase images (full-size originals shipped to phones). | ✅ Added `*.supabase.co/storage/v1/object/public/**` to `images.remotePatterns` ([next.config.ts](next.config.ts)) and removed all three `unoptimized` props. |
| P6 | Med | Cal.com embed JS (~100 KB) loads on `/booking` mount before any interaction. | 🔶 Acceptable for now — the page exists to book. If TTI on `/booking` matters later, defer `getCalApi()` to the first calendar click. |
| P7 | Low | `react-markdown` + `remark-gfm` ship to journal post pages (~40 KB gz). | 🔶 Fine at current traffic; consider rendering markdown server-side at publish time if the journal grows. |
| P8 | Low | Fixed-position grain overlay (`body::after`) adds a compositing layer. | ⚪ Measured trade-off of the redesign; pure CSS, transform-free, `opacity: 0.04`. Remove if Speed Insights ever flags paint cost. |

## 2. Security (safety)

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| S1 | High* | `/api/inbound/email` was **fail-open**: with `INBOUND_WEBHOOK_SECRET` unset, anyone could POST fake messages into the admin inbox. (*Endpoint is intentionally dormant, lowering practical risk.*) | ✅ Now fails closed (503) in production when the secret is missing ([app/api/inbound/email/route.ts](app/api/inbound/email/route.ts)). Dev behaviour unchanged. |
| S2 | Med | Contact form interpolated the raw user `name` into the notification email subject. Resend's JSON API makes classic CRLF header injection unlikely, but unsanitised input in subjects is still a smell. | ✅ CR/LF stripped before interpolation ([lib/actions.ts](lib/actions.ts)). |
| S3 | Med | CSP `img-src` ended with bare `https:` — any origin could be used in an injected `<img>`, weakening the exfiltration barrier the rest of the CSP builds. | ✅ Tightened to an explicit allowlist: self, data/blob, `primary.jwwb.nl`, `*.supabase.co`, Cal.com ([next.config.ts](next.config.ts)). |
| S4 | Low | `script-src 'unsafe-inline'` remains (required by Next hydration). | ⚪ Documented trade-off in config comments; nonce-based CSP is the upgrade path if ever needed. |
| S5 | Low | Rate limiter fails open if Upstash is down. | 🔶 Intentional (graceful degradation). Revisit only if abuse is observed. |
| S6 | ⚪ | Checked and found **sound**: HMAC order token uses `timingSafeEqual` (128-bit truncation is fine); all five public Server Actions validate, length-cap, honeypot and rate-limit input; admin actions re-check `getAdminUser()` server-side; inbound email HTML rendered inside a fully sandboxed iframe; `.env.local` gitignored; admin routes `noindex`; Mollie webhook follows content-type → rate-limit → local-lookup ordering and always 200s. | ⚪ |

## 3. SEO

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| E1 | High | Locale redirect (`/` → `/nl`\|`/en`) varies on `Accept-Language` but sent no `Vary` header — CDN/proxies could cache an NL redirect for EN visitors. | ✅ `Vary: Accept-Language` set on the redirect ([proxy.ts](proxy.ts)). |
| E2 | Med | Root layout `alternates.languages` lacked `x-default` (per-page `buildMetadata` already emitted it). | ✅ Added `"x-default": "/nl"` ([app/[lang]/layout.tsx](app/%5Blang%5D/layout.tsx)). |
| E3 | Med | Service detail pages had a visual breadcrumb but no `BreadcrumbList` structured data. | ✅ New `BreadcrumbJsonLd` emitted on every service page ([components/JsonLd.tsx](components/JsonLd.tsx)). |
| E4 | Med | First-party reviews shown with stars/average but no `AggregateRating` schema → no review snippet eligibility. | ✅ New `AggregateRatingJsonLd` on `/reviews` only (the page that visibly displays the reviews, per Google's guidelines). |
| E5 | Med | Shop listed products with prices but no `Product` schema. | ✅ New `ProductsJsonLd` (ItemList of Product + Offer with availability) on `/shop`. |
| E6 | Low | Journal `Article` schema: relative `image` URL, missing `url` property. | ✅ Absolute image URL + `url` added ([app/[lang]/journal/[slug]/page.tsx](app/%5Blang%5D/journal/%5Bslug%5D/page.tsx)). |
| E7 | Low | Privacy/Terms meta descriptions were just the page title. | ✅ Real bilingual descriptions added. |
| E8 | ⚪ | Checked and found **sound**: unique titles + descriptions everywhere, canonical + hreflang per page, sitemap with locale alternates + journal posts, robots.txt disallowing admin/api/auth/checkout/return, single `h1` per page, FAQ schema emitted once (home only), OG images per page, return pages noindexed. | ⚪ |

---

## "Front page doesn't show pictures" — investigation result

Could **not** be reproduced anywhere:

- **Production** (`www.majorillegarden.nl/nl`): every rendered `<img>` URL returns `200` (`/_next/image` variants and raw files, with and without browser `Accept: image/avif,webp` headers).
- **Fresh local dev** (port 3001): all homepage image URLs return `200`; smoke driver passes.
- The image files themselves (refreshed today 18:38) open fine and look correct.
- CSP `img-src` permits everything the page uses.

**Likely explanation:** the server on **localhost:3000 is the WebForce-Agency wedding site**, not Majorille (verified — it serves `Bruiloftenhome.jpg`/Sanity CDN content and 404s Majorille paths). If you were looking at `localhost:3000`, that's the wrong app; my Majorille dev server runs on **3001**. If you saw it on production, hard-refresh (Ctrl+F5) — a deploy was in flight today and a stale cached HTML shell can briefly reference assets from the previous deployment. If it still reproduces for you, tell me the exact URL + browser.

One real bug the smoke test *did* find: locally, `NEXT_PUBLIC_CAL_USERNAME` is empty in `.env.local`, so `/booking` renders the call/email fallback instead of the service picker (prod is configured correctly). Set it locally if you want booking parity in dev.

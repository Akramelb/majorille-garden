# Handoff — what only you can do

Everything else is built. This list is the only stuff that needs your accounts, credentials, or human judgment.

> ⏰ **Reminders (added 2026-05-22):**
> - **Add your parents' email to Cal.com** (as team member / for booking notifications). Account: `minekram43@gmail.com`, username `majorillegarden`.
> - **Add your parents' email to `ADMIN_EMAILS`** (Vercel env + `.env.local`) so they can log into `/admin`. Currently only `minekram43@gmail.com`.
> - For reviews/blog/admin to work: run the **reviews + blog_posts SQL** in Supabase, and add the **Auth redirect URLs** (`http://localhost:3000/auth/callback`, `https://majorille-garden.vercel.app/auth/callback`) under Supabase → Authentication → URL Configuration.

Total estimated time if you sit down and do it all: **~2 hours**, mostly waiting for DNS.

## Critical (must do before going live)

### 1. Create a Supabase project — 15 min
1. Go to https://app.supabase.com → New project. Pick a region (Frankfurt is closest).
2. Wait ~2 min for it to provision.
3. Open the SQL Editor and paste the block from [README.md](README.md) under **Supabase setup**. Run it.
4. Settings → API. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY`
5. Paste into `.env.local` and (when you deploy) into Vercel's project env vars.

Without this, the contact form and newsletter still appear to work (they log to the server console) but nothing is persisted.

### 2. Cal.com event types — ~45 min

We use **Cal.com** (the open-source Calendly) — its free plan covers unlimited event types and multiple schedules, so there's no monthly fee.

Men and women have different opening hours, so each treatment needs **two** event types (one per audience), each attached to a different availability schedule. The site picks the right one automatically based on the audience the visitor selects.

1. Sign up at https://cal.com.
2. Note your username — the URL part after cal.com/. Put it in `NEXT_PUBLIC_CAL_USERNAME` in `.env.local`.
3. **Create 2 availability schedules** (Availability → + New):
   - **Women** — Monday–Sunday 10:00–20:00
   - **Men** — Mon–Wed 09:00–20:00, Thu–Sun 09:00–12:30
4. **Create 2 event types per treatment** (16 total). The URL slug must be `<base>-women` and `<base>-men`, where `<base>` is the `bookingSlug` in [lib/content.ts](lib/content.ts). On each event type, set **Availability** to the matching schedule:

   | Treatment | base slug | women event | men event |
   |---|---|---|---|
   | Warme zandbad | `warm-sand-bath` | `warm-sand-bath-women` | `warm-sand-bath-men` |
   | Traditionele massage | `traditional-massage` | `traditional-massage-women` | `traditional-massage-men` |
   | Bio head spa | `bio-head-spa` | `bio-head-spa-women` | `bio-head-spa-men` |
   | Hete steen | `hot-stone-massage` | `hot-stone-massage-women` | `hot-stone-massage-men` |
   | Kruidenstempel | `herbal-stamp-massage` | `herbal-stamp-massage-women` | `herbal-stamp-massage-men` |
   | Lichaamsscrub | `body-scrub` | `body-scrub-women` | `body-scrub-men` |
   | Dry cupping | `dry-cupping` | `dry-cupping-women` | `dry-cupping-men` |
   | Voedingsadvies | `nutritional-advice` | `nutritional-advice-women` | `nutritional-advice-men` |

   (Tip: build all 8 women's events first against the Women schedule, then **Duplicate** each, switch the copy's Availability to the Men schedule, and rename the URL `-women` → `-men`.)
5. For treatments with multiple durations (60/90/120 min), use Cal.com's **multiple-duration** option on the event type (Event → Duration → "Allow booker to select duration") instead of separate events. Cal.com doesn't take payment — mention prices in the event description.

Without this, the booking page shows a graceful "Call or email" fallback instead of the embed — so it's not blocking, but you lose the self-service booking.

### 3. Resend account (optional but recommended) — 10 min
For owner notifications when someone fills out the contact form.
1. https://resend.com → sign up.
2. Verify your sending domain (`majorillegarden.nl`) — they walk you through the DNS records.
3. Settings → API Keys → create one → paste into `.env.local` as `RESEND_API_KEY`.
4. Also set `NOTIFY_FROM=Majorille Garden <noreply@majorillegarden.nl>` and `NOTIFY_TO=info@majorillegarden.nl`.

Without this, contact submissions land only in Supabase — you'd need to check the dashboard or build the admin UI (Phase 2) to read them.

### 4. Deploy to Vercel — 15 min
1. Push the repo to GitHub (it's already initialised at `majorille-garden/`).
2. https://vercel.com → New Project → import the repo.
3. Add the env vars from `.env.local` (Production + Preview).
4. Deploy — Vercel auto-detects Next 16.

You get a preview URL like `majorille-garden-xyz.vercel.app`. Test there before cutting over the real domain.

### 5. Domain cutover — 30 min + DNS propagation time
1. In Vercel → Project → Domains → add `majorillegarden.nl` and `www.majorillegarden.nl`.
2. Vercel shows you the DNS records to set.
3. Log into wherever the domain is registered (probably JouwWeb itself; otherwise TransIP/Versio/Hostnet). Update the records.
4. DNS takes 10 min to 24 hrs to propagate. Vercel auto-issues an HTTPS cert.
5. Once `www.majorillegarden.nl` resolves to the new site, you can shut down the JouwWeb subscription.

**Note:** If the domain is owned/locked to JouwWeb, you might need to transfer the registration to another registrar (TransIP is the Dutch standard) before pointing to Vercel.

## Should do before launch

### 6. Native-speaker review — 30 min
- All Dutch text is verbatim from the live site (I fixed a few obvious typos like "guur" → "geur"). Skim [lib/content.ts](lib/content.ts) once more.
- All English text is my translation. Have someone who speaks both languages read through the service descriptions in particular.

### 7. Decide canonical email — 5 min
The old site used two: `info@majorillegarden.nl` and `majorillegarden@gmail.com`. I've set the build to `info@...`. If the gmail is the one your parents actually check, change `SITE.email` in [lib/content.ts](lib/content.ts) and `NOTIFY_TO` in `.env.local`.

### 8. Photos — review and trim
50 photos downloaded from JouwWeb live in [public/images/](public/images/). Open the local site and check each page — if any look low-res or unflattering, swap them out. You can put higher-res versions in the same paths and they'll Just Work.

The hero image on the home page (`/public/images/home/hero-promo.png`) is the AI-generated headspa promo. If you have a real photo of the studio you'd prefer there, drop it in with the same filename.

## Nice to have

### 9. Real photos of the studio interior
The Moroccan-aesthetic AI images are fine as placeholders, but a few photos of the actual treatment room, the sand bath setup, the Berber rugs, etc. would dramatically lift the perceived quality. Phase 2 admin will let you upload these via Supabase Storage; for now, just drop new JPGs into `public/images/services/<slug>/`.

### 10. Google Business Profile
- Verify Majorille Garden at https://business.google.com.
- The structured-data LocalBusiness schema is already on every page, so once Google indexes the new site it'll connect them.
- Adds the business to Google Maps + Knowledge Panel + Search snippets.

### 11. Social profiles
You said the current site has no social links. If you want Instagram or Facebook, set them up under `@majorillegarden`, then add the URLs to `SITE` in [lib/content.ts](lib/content.ts) (currently `sameAs: []` in the JSON-LD) — that's how Google connects the brand across platforms.

## What I built that you can ignore until Phase 2/3

- `/admin` and `/admin/login` — UI scaffold only. When you want a CMS so your parents can edit prices without you, ping me to wire up Supabase magic-link auth and build the dashboard. Estimated: ~1 day.
- `lib/email.ts` — already integrated with the contact form. Auto-activates the moment you set the Resend env vars.
- Mollie / payments — nothing built yet. When you want real checkout for the shop, that's Phase 3.

## What's already done (so you don't redo it)

- ✅ All 8 service pages, NL + EN, with hero / sections / pricing / gallery / closing CTA
- ✅ Home, about, services index, booking, contact, shop, privacy, terms
- ✅ Bilingual via Next 16 native i18n (`/nl`, `/en`)
- ✅ Custom booking flow with service picker → Calendly deep-link (or graceful fallback)
- ✅ Contact form + newsletter writing to Supabase via Server Actions
- ✅ Owner email notifications via Resend (when configured)
- ✅ Moroccan design system: terracotta/sand/olive palette, Cormorant + Inter fonts
- ✅ Cookie banner (AVG/GDPR compliant)
- ✅ Privacy policy + Terms (NL + EN, AVG-aware)
- ✅ Per-page SEO metadata, hreflang alternates, canonical URLs
- ✅ JSON-LD LocalBusiness + per-service Service structured data
- ✅ sitemap.xml + robots.txt (auto-generated)
- ✅ Dynamic OG image per locale
- ✅ Custom SVG favicon (terracotta M with serif treatment)
- ✅ Skip-to-content link, focus rings, semantic HTML, breadcrumbs
- ✅ Styled 404, loading state on booking page
- ✅ Admin scaffold ready for Phase 2 (login page exists, dashboard placeholder)
- ✅ All 50 spa photos downloaded from JouwWeb CDN to local public/

## When in doubt

```bash
npm run dev       # local at http://localhost:3000
npm run build     # production build
npm run typecheck # TypeScript only
npm run check     # typecheck + lint
```

Open http://localhost:3000 and look around. Every visible bug is fixable. Ping me with anything you want different.

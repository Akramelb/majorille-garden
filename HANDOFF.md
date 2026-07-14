# Handoff — what only you can do

Everything else is built. This list is the only stuff that needs your accounts, credentials, or human judgment.

> 🏖️ **Vakantiemodus (added 2026-07-14):** de site toont t/m 15 augustus 2026 automatisch vakantiemeldingen (banner, boeking, shop, contact) — zie `lib/vacation.ts`. Ze verdwijnen vanzelf op 16 augustus. **Wat alleen jij kunt doen:** blokkeer in Cal.com de beschikbaarheid t/m 15 augustus (Availability → beide schedules "Women hours" én "Men hours" → date override / out-of-office), anders kan een betalende klant een slot vóór 16 augustus boeken dat niemand kan leveren. Wil je andere datums? Pas de twee datums in `lib/vacation.ts` aan én de teksten onder `vacation` in `app/[lang]/dictionaries/{nl,en}.json`.
>
> ⏰ **Reminders (added 2026-05-22):**
> - **Add your parents' email to Cal.com** (as team member / for booking notifications). Account: `minekram43@gmail.com`, username `majorillegarden`.
> - **Add your parents' email to `ADMIN_EMAILS`** (Vercel env + `.env.local`) so they can log into `/admin`. Currently only `minekram43@gmail.com`.
> - **Supabase → Authentication → URL Configuration** must match the live site or magic-links break:
>   - **Site URL:** `https://www.majorillegarden.nl`
>   - **Additional Redirect URLs:** `https://www.majorillegarden.nl/auth/callback`, `http://localhost:3000/auth/callback`
>   - If either is set to a `*.vercel.app` host, Supabase silently rewrites the link to that host and the session cookie binds to the wrong domain.

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

You get a preview URL like `majorille-garden-xyz.vercel.app`. Use it for smoke-testing only — never share with customers or set as the Site URL anywhere (Supabase, Mollie, Cal.com). All production wiring should reference `https://www.majorillegarden.nl`.

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

The hero image on the home page (`/public/images/home/hero-promo.jpg`) is the AI-generated headspa promo. If you have a real photo of the studio you'd prefer there, drop it in with the same filename (was `.png` until 2026-05-25 — re-encoded as JPG via `scripts/compress-heroes.mjs` for an ~90% smaller payload).

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

## Phase 3 setup — Supabase orders table

Phase 3 (Mollie checkout + booking paywall) introduces one new table — `orders` —
covering both product orders and booking deposits/full payments. Run this SQL in
the Supabase SQL editor before the Mollie checkout / webhook routes go live:

```sql
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  kind text not null check (kind in ('product','booking')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  mollie_payment_id text unique,
  checkout_url text,
  status text not null default 'open'
    check (status in ('open','pending','authorized','paid','failed','canceled','expired','refunded')),
  paid_at timestamptz,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  locale text not null default 'nl' check (locale in ('nl','en')),
  service_slug text,
  booking_slug text,
  audience text check (audience in ('women','men')),
  variant_idx integer,
  line_items jsonb,
  shipping_address jsonb,
  notes text
);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_kind_idx on orders (kind);
alter table orders enable row level security;
notify pgrst, 'reload schema';
```

RLS is enabled with no policies, so the table is reachable only via the
service-role client (which bypasses RLS) — exactly the pattern the rest of the
admin uses.

### Env vars to set

- `MOLLIE_API_KEY` — use a `test_xxx` key in `.env.local`, a `live_xxx` key in
  Vercel production. The code falls back gracefully (`hasMollieConfig()`) when
  this is unset, but the checkout flow won't work end-to-end without it.
- `NEXT_PUBLIC_SITE_URL` — already set in production. For local end-to-end
  testing of the webhook, override this in `.env.local` to your tunnel URL
  (see below).

### Local webhook testing — you need a tunnel

Mollie's webhook can't reach `http://localhost:3000`. To test the full
checkout → webhook → order-paid flow locally:

1. Start a tunnel pointed at your dev server, e.g.
   - `cloudflared tunnel --url http://localhost:3000`, or
   - `ngrok http 3000`.
2. Copy the public HTTPS URL into `.env.local` as
   `NEXT_PUBLIC_SITE_URL=https://<your-tunnel>.trycloudflare.com` (no trailing
   slash).
3. Restart `npm run dev` so the new env is picked up.
4. Run a Mollie test payment. The webhook will hit
   `<tunnel>/api/mollie/webhook` and flip the order status.

When the tunnel is down, set `NEXT_PUBLIC_SITE_URL` back to
`http://localhost:3000` for normal local browsing.

## When in doubt

```bash
npm run dev       # local at http://localhost:3000
npm run build     # production build
npm run typecheck # TypeScript only
npm run check     # typecheck + lint
```

Open http://localhost:3000 and look around. Every visible bug is fixable. Ping me with anything you want different.

## Phase 3 security follow-up — RLS check

Run in the Supabase SQL editor before the Mollie flow goes live. Idempotent;
safe to re-run.

```sql
-- Run in Supabase SQL editor. Idempotent; safe to re-run.
alter table reviews     enable row level security;
alter table blog_posts  enable row level security;
alter table faqs        enable row level security;
alter table contact_submissions    enable row level security;
alter table newsletter_subscribers enable row level security;
-- Service role bypasses RLS; no permissive policies are added on purpose.
notify pgrst, 'reload schema';
```

Verify by hitting the table from the browser console with just the anon key — it should return `[]` for every table.

### Phase 3 security follow-up — env vars

Add these to `.env.local` and Vercel (Production + Preview):

- `ORDER_TOKEN_SECRET` — random ≥32 char string (HMAC secret used to sign
  `?t=` tokens on the `/booking/return` and `/shop/return` pages). Without it
  the return pages 404 even for legitimate paid orders. In dev, set
  `ORDER_TOKEN_SECRET` to any 32+ char string.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — free tier at
  upstash.com (~10k commands/day is plenty). Used by `lib/ratelimit.ts` to
  throttle contact / newsletter / review / payment / webhook / magic-link
  endpoints per IP. If unset, rate-limiting is silently disabled (dev-friendly,
  but you want it on in production).

## Activity feed setup — email_log table

Tracks every email send/skip/failure (Resend) for the `/admin/inbox` audit feed.

```sql
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  kind text not null check (kind in (
    'owner_notification',
    'customer_order_confirmation',
    'customer_booking_link',
    'other'
  )),
  recipient text not null,           -- comma-separated if multiple
  subject text not null,
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
  error text,
  resend_id text,                    -- Resend's returned email id, when available
  related_order_id uuid references orders(id) on delete set null,
  related_kind text                  -- 'booking' | 'product' | null
);
create index if not exists email_log_created_at_idx on email_log (created_at desc);
create index if not exists email_log_kind_idx on email_log (kind);
alter table email_log enable row level security;
notify pgrst, 'reload schema';
```

## Inbound email — Gmail → webhook pipeline

Show everything that lands in `majorillegarden@gmail.com` inside `/admin/inbox`
without giving the site any Gmail credentials. The site exposes a webhook
that an inbound mail provider POSTs to; pick **one** provider, forward
Gmail to it.

### 1. Run the SQL

```sql
create table if not exists inbound_emails (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  from_address text not null,
  from_name text,
  to_address text not null,
  subject text not null,
  text_body text,
  html_body text,
  -- Upstream message id (Resend Inbound id / Message-Id header). Unique
  -- so provider retries dedupe at insert time.
  external_id text unique
);
create index if not exists inbound_emails_created_at_idx
  on inbound_emails (created_at desc);
alter table inbound_emails enable row level security;
notify pgrst, 'reload schema';
```

### 2. Set the shared secret on Vercel

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" \
  > /tmp/inbound-secret.txt
vercel env add INBOUND_WEBHOOK_SECRET production < /tmp/inbound-secret.txt
vercel env add INBOUND_WEBHOOK_SECRET preview   < /tmp/inbound-secret.txt
vercel env add INBOUND_WEBHOOK_SECRET development < /tmp/inbound-secret.txt
```

Webhook URL the provider needs:
`https://www.majorillegarden.nl/api/inbound/email`
Auth header the provider must send:
`Authorization: Bearer <the secret>`

### 3a. Option A — Resend Inbound (when domain verifies)

Requires the `majorillegarden.nl` Resend domain to flip to `verified` AND
inbound capability to flip from `disabled` → `enabled` (some Resend plans
gate this; check their dashboard once verified).

1. Resend → Domains → `majorillegarden.nl` → Inbound → add address
   `inbox@majorillegarden.nl`.
2. Resend gives you MX records — add them at TransIP for `inbox` subdomain.
3. Resend → Webhooks → add endpoint:
   - URL: `https://www.majorillegarden.nl/api/inbound/email`
   - Events: `email.received`
   - Add header `Authorization: Bearer <INBOUND_WEBHOOK_SECRET>`
4. Gmail (`majorillegarden@gmail.com`) → Settings → Forwarding → add
   `inbox@majorillegarden.nl` → confirm the verification mail Resend
   relays to that same address (it'll show up in /admin/inbox; click the
   confirm link inside the iframe).
5. Set a filter: "Matches: *" → "Do this: Forward to inbox@majorille…".

### 3b. Option B — Cloudflare Email Routing (works today, no Resend dependency)

Free, no plan gates. Adds Cloudflare DNS as middleware though — only do
this if Resend Inbound blocks you.

1. Cloudflare → add `majorillegarden.nl` zone (changes nameservers — talk
   to me before doing this; TransIP would no longer be authoritative).
2. Email → Email Routing → enable. Cloudflare auto-adds the MX records.
3. Create a worker route that forwards to our webhook (paste the script
   I gave you separately — handles the auth header).
4. Gmail forward rule: same as 3a step 4-5, just point at the Cloudflare
   address (e.g. `inbox@majorillegarden.nl`).

### 4. Verify

Send a test mail to `majorillegarden@gmail.com`, wait ~10s, refresh
`/admin/inbox` — the message should appear with an `INBOX` pill. Click it
to open the detail view at `/admin/inbox/<uuid>` and read the HTML body
(sandboxed iframe — links work, scripts don't).

If nothing appears:
- Vercel → Logs filter `[inbound-email]` — drops show up here.
- Provider dashboard (Resend/Cloudflare) → delivery attempt logs — 401
  means the `INBOUND_WEBHOOK_SECRET` doesn't match between provider and
  Vercel, 200 with `stored: false` means the payload was deduped.

## Admin: foto's wisselen

Parents can now swap the three hero images (home, home promo block, about
page) from `/admin/images` without a deploy. Uploads land in the
`site-images` Supabase Storage bucket; the override URL is stored on the
singleton `site_settings` row. Consumers (`getHeroImageUrl(slot)`) fall back
to the static `/public/images/...` path if no override exists.

### 1. Run the SQL (Supabase → SQL editor)

```sql
create table if not exists site_settings (
  id text primary key,
  hero_home_url text,
  hero_promo_url text,
  hero_about_url text,
  updated_at timestamptz default now()
);
insert into site_settings (id) values ('default')
  on conflict (id) do nothing;
alter table site_settings enable row level security;
notify pgrst, 'reload schema';
```

### 2. Create the Storage bucket (Supabase → Storage)

- New bucket → name **`site-images`** → **Public bucket: ON**.
- File size limit: **10 MB** (matches the server-side cap).
- Allowed MIME types: `image/jpeg, image/png, image/webp`.

That's it — uploads from `/admin/images` now work end-to-end.

## Admin: magic-link inloggen (OTP code)

The magic-link email contains BOTH a clickable link AND a 6-digit code. The
code is the resilient path: Gmail/Outlook URL scanners can't "use up" a
numeric code the way they consume one-shot links (which is why the link
sometimes returns "Token has expired or is invalid" before the human even
clicks it).

### Supabase dashboard tweaks (one-time)

**Authentication → Email Templates → Magic Link** — paste this template
(or merge into the existing HTML):

```html
<h2>Inloggen op Majorille Garden Admin</h2>
<p>Klik op de link, OF kopieer de 6-cijferige code naar het inlogformulier:</p>
<p><a href="{{ .ConfirmationURL }}">Inloggen via link</a></p>
<p style="font-family: monospace; font-size: 20px; letter-spacing: 6px;">
  {{ .Token }}
</p>
<p style="color: #888; font-size: 12px;">
  De code werkt 1 uur. Vraag op majorillegarden.nl/admin/login een nieuwe aan
  als hij verlopen is.
</p>
```

**Authentication → URL Configuration** — must be exactly:

- **Site URL:** `https://www.majorillegarden.nl`
- **Additional Redirect URLs** (each on its own line):
  - `https://www.majorillegarden.nl/auth/callback`
  - `http://localhost:3000/auth/callback`

If the Site URL is set to anything else (especially `*.vercel.app`), the
magic link redirects to that host instead of the custom domain.

## Admin: kortingscodes (`/admin/promos`)

Parents can add/disable promo codes from the admin without a redeploy.
Two cross-sell codes (BEDANKT10 + BOEK10) are seeded so the upsell banners
on `/booking/return` and `/shop/return` work the moment the table exists.

### Run the SQL (Supabase → SQL editor)

```sql
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent integer not null
    check (discount_percent > 0 and discount_percent <= 100),
  applies text not null check (applies in ('product','booking')),
  label_nl text not null,
  label_en text not null,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists promo_codes_code_idx on promo_codes (code);
alter table promo_codes enable row level security;

-- Seed the two cross-sell defaults — these match what the upsell banners
-- on /booking/return and /shop/return look up by hard-coded code string.
insert into promo_codes (code, discount_percent, applies, label_nl, label_en)
values
  ('BEDANKT10', 10, 'product', '10% korting op alle producten', '10% off all products'),
  ('BOEK10',    10, 'booking', '10% korting op je volgende behandeling', '10% off your next treatment')
on conflict (code) do nothing;

notify pgrst, 'reload schema';
```

That's all — `/admin/promos` lists what's there, lets you add new codes
(`KERST20`, `LENTE15`, whatever), toggle on/off, or delete. Codes are
scoped by `applies` (product / booking) so a customer pasting BOEK10 into
the shop checkout still pays full price.

## Admin: bovenbalk (`/admin/banner`)

Scrolling announcement bar at the top of every page. Three slots in a
single seamless marquee: phone (left), admin-editable middle text (e.g. a
promo code or seasonal notice), email (right). Hover pauses the scroll;
`prefers-reduced-motion` disables it entirely.

### Run the SQL (Supabase → SQL editor)

Adds three columns to the existing `site_settings` row — safe to re-run
(uses `IF NOT EXISTS`).

```sql
alter table site_settings
  add column if not exists announcement_enabled boolean not null default false,
  add column if not exists announcement_text_nl text,
  add column if not exists announcement_text_en text;

notify pgrst, 'reload schema';
```

That's it — `/admin/banner` then drives the bar. When the bar is disabled
(or both texts are empty), the layout's CSS var `--bar-h` stays at `0px`
and the header sits flush against the viewport top exactly like before the
feature existed.

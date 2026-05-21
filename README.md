# Majorille Garden — Next.js redesign

The new Majorille Garden site. Replaces the current JouwWeb site with a Next.js 16 + Tailwind v4 + Supabase build, hosted on Vercel, with Cal.com-driven bookings and (Phase 3) Mollie checkout.

## Phase 1 — what's here today

- Bilingual NL/EN routing (`/nl/...`, `/en/...`) via Next.js's native `app/[lang]` i18n. NL is the default; English is detected via `Accept-Language`.
- Home, About, Services index + 8 treatment pages, Booking, Contact, Shop catalog.
- All content + photos sourced from the live site at https://www.majorillegarden.nl/. Photos live in `public/images/`.
- Cal.com-powered booking — audience (women/men) + service picker on the left, Cal.com inline embed on the right, deep-linked per treatment and audience.
- Contact form + newsletter signup write to Supabase via Server Actions. If Supabase env vars are missing, submissions are logged to the server console (so the site doesn't break during local dev).
- Moroccan luxury design system: terracotta / sand / olive / deep brown palette, Cormorant + Inter via `next/font/google`.

## Stack

| | |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| i18n | Native `app/[lang]` + dictionaries (no `next-intl`) |
| Backend | Supabase (Postgres + Storage) — only contact + newsletter in Phase 1 |
| Bookings | Cal.com embed (`@calcom/embed-react`) |
| Email | Phase 1 logs to console — wire Resend later |
| Hosting | Vercel |

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000 — proxy redirects to /nl
```

TypeScript check:

```bash
npx tsc --noEmit
```

Production build:

```bash
npm run build
npm start
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. With no values the contact and newsletter forms still work locally — submissions are just `console.warn`'d on the server.

| Variable | Used by | Required for |
|---|---|---|
| `SUPABASE_URL` | `lib/supabase.ts` | Persisting contact submissions + newsletter |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts` | Same as above |

## Supabase setup

Create a new project at https://app.supabase.com, then run this SQL in the SQL Editor:

```sql
create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  read boolean default false
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null unique,
  confirmed_at timestamptz
);

alter table contact_submissions enable row level security;
alter table newsletter_subscribers enable row level security;
-- writes happen with the service-role key on the server, so no policies needed for Phase 1
```

Grab the `URL` and `service_role` key from Project Settings → API, paste them into `.env.local` (locally) and into Vercel's project environment (production).

## Cal.com setup

Bookings use **Cal.com** (open-source Calendly; free plan covers unlimited event types + multiple schedules). Full step-by-step with the slug table is in [HANDOFF.md](HANDOFF.md) §2. In short:

1. Create a Cal.com account; put your username in `NEXT_PUBLIC_CAL_USERNAME`.
2. Create two availability schedules (Women / Men hours).
3. Each service has a `bookingSlug` in `lib/content.ts` (e.g. `bio-head-spa`). Create two event types per service — `<bookingSlug>-women` and `<bookingSlug>-men` — each on the matching schedule. The booking page builds the Cal.com link as `<username>/<bookingSlug>-<audience>`.

## Vercel deploy

1. Push this repo to GitHub.
2. In Vercel → New Project → import the repo.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars (Production + Preview).
4. Deploy — Vercel auto-detects Next.js.
5. **Domain cutover**: once you're happy with the preview, point `majorillegarden.nl` from JouwWeb's DNS to Vercel. In Vercel → Domains → Add `majorillegarden.nl`, and follow the instructions to set the `A` record (or `CNAME` for `www.`) at your domain registrar. JouwWeb's domain registration may have to be transferred separately if the domain is currently locked to their nameservers.

## Editing content

Phase 1 content lives in two places:

- `lib/content.ts` — services, products, FAQ, testimonial, about page. Each piece of text has `{ nl, en }` versions.
- `app/[lang]/dictionaries/{nl,en}.json` — UI strings (buttons, labels, headers).

Edit, save, redeploy.

Phase 2 introduces a Supabase-backed admin at `/admin` so your parents can edit prices, copy, and gallery without redeploying.

## Roadmap

- **Phase 2 — Admin CMS**: `/admin` with magic-link login, edit services/FAQ/copy/gallery, view contact + newsletter submissions.
- **Phase 3 — E-commerce**: real Mollie checkout for the shop (iDEAL + cards), order management in admin, order-confirmation emails via Resend.

## Notes from migration

- Original site is in Dutch only — English copy in this build is freshly translated. Have a Dutch speaker review the English service descriptions before launch.
- Original site had a few typos ("guur" → "geur", "wanner" → "wanneer", "Maan" → "Man" on the booking page). Those have been silently fixed in `content.ts`.
- The site used two contact emails (`info@majorillegarden.nl` and `majorillegarden@gmail.com`). This build standardises on `info@...` — change in `lib/content.ts` (`SITE.email`) if you'd prefer the gmail.
- All photos were re-downloaded from the JouwWeb CDN at the highest available width and now live in `public/images/`. The new site no longer depends on JouwWeb.

## Project structure

```
app/[lang]/                    bilingual routes
  layout.tsx                  root layout (fonts, Header, Footer)
  page.tsx                    home
  about/page.tsx
  services/page.tsx           treatment index
  services/[slug]/page.tsx    treatment detail (8 services)
  booking/page.tsx            Cal.com picker (audience + service)
  contact/page.tsx
  shop/page.tsx
  dictionaries.ts             dictionary loader
  dictionaries/{nl,en}.json   UI strings
components/
  layout/Header.tsx           sticky nav, mobile menu, LangSwitch
  layout/Footer.tsx
  layout/LangSwitch.tsx
  ui/Container.tsx            layout primitives
  sections/                   ServiceCard, FAQAccordion, forms, BookingForm
lib/
  content.ts                  all services, products, FAQ — bilingual
  actions.ts                  Server Actions (contact, newsletter)
  supabase.ts                 service-role client (server-only)
proxy.ts                      locale detection + redirect
public/images/                photos by section
```

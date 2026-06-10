---
name: majorille-builder
description: Implements features in the Majorille Garden Next.js 16 / React 19 / Tailwind v4 repo, strictly following the house rules in rules.md. Use for any non-trivial code change — adds a route, server action, admin page, or wires a new lib helper. Knows the i18n pattern (async params, hasLocale, dictionaries), the Supabase + Server Action pattern (hasSupabaseConfig fallback, fire-and-forget email), and the admin shell convention.
tools: Read, Edit, Write, Glob, Grep, Bash, NotebookEdit
---

You are implementing code in the Majorille Garden repository. This is a Moroccan-inspired wellness spa site for owners Fati + Thami (parents of the operator Akram).

## Before you write anything

Read these two files first, every time:
- `CLAUDE.md` — architecture, phased roadmap, current state
- `rules.md` — 32 numbered enforceable rules; they override training-data defaults

Then read the files in the area you're changing. Match existing patterns — comment density, naming, import order, file layout.

## Stack you must respect

- **Next 16 + React 19 + Tailwind v4**. Not Next 14. Not Pages Router. `cookies()` / `params` / `searchParams` are async. `PageProps<...>` is a generated global (regenerate with `npx next typegen` if missing).
- **No `tailwind.config.js`** — tokens in `app/globals.css` under `@theme`.
- **Middleware is `proxy.ts`**, function + file both called `proxy`. Matcher excludes `_next|api|admin|auth|.*\..*`.

## Idioms to copy

- **Every `[lang]` page** starts with `const { lang } = await props.params; if (!hasLocale(lang)) notFound();`
- **Server-only files** import `"server-only"` at the top.
- **Server Actions** that write to Supabase gate on `hasSupabaseConfig()` — `console.warn` and return success when env is missing, never throw.
- **Admin mutations** re-check `getAdminUser()` inside the action — the route guard is not enough.
- **Owner notifications** are `void sendOwnerEmail(...)` — fire and forget, never awaited.
- **Admin pages** start with `export const dynamic = "force-dynamic"` + `const user = await getAdminUser(); if (!user) redirect("/admin/login");`, render inside `<AdminShell userEmail={user.email ?? null}><AdminPage title="...">`.
- **Money is stored in cents** everywhere. Format at the render boundary. External APIs that want euros get the conversion done at the boundary (e.g. `centsToEuroString` in `lib/mollie.ts`).
- **`useSearchParams` in a client component** must be inside `<Suspense>` at the page level — see `app/admin/login/page.tsx` for the pattern.

## Localization

- Domain content (services, products, FAQ): `LocalizedString` / `LocalizedRichText` in `lib/content.ts`.
- UI strings: `app/[lang]/dictionaries/{nl,en}.json` loaded via the server-only `getDictionary`. Write NL first, then EN. Never ship empty EN.
- Don't import the `Dictionary` type into client components — resolve strings on the server, pass as props.

## Style

- Use the named palette utilities — `text-deep-brown`, `bg-cream`, `bg-terracotta`, `text-olive`, `bg-sand`. No raw hex.
- Display type Fraunces (`.display`, `.serif`), body Inter — already loaded in the root layout.
- Mobile: don't override `overflow-x: clip` on html/body; keep `hyphens: auto` on headings; form inputs stay ≥16px on mobile (prevents iOS zoom).

## When you finish

1. Run `npm run check` (typecheck + lint). Fix errors in files you wrote. Report errors in other files; don't silently touch them.
2. In your final message, list every file created/modified with a one-line summary, and call out any deviations from the spec.
3. Never add a new top-level doc — extend the existing README/CLAUDE/HANDOFF/rules instead.

## When you should stop and report instead of guessing

- The spec contradicts `rules.md`.
- A required env var is missing AND there's no obvious fallback pattern in the existing code.
- A library version differs from what the spec assumes (note the actual version and continue if compatible; stop and ask if breaking).
- You'd need to delete or rewrite something a prior commit deliberately built (check git blame if unsure).

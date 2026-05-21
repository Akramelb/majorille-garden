#!/usr/bin/env node
// Smoke driver for the Majorille Garden site.
// Drives the *running* Next.js app over HTTP: asserts status codes and that the
// server-rendered HTML actually contains the expected content (i18n, SEO,
// structured data, booking UI). This is the layer changes to this content-driven
// site touch — routes rendering the right localized copy.
//
// Usage:
//   node .claude/skills/run-majorille-garden/driver.mjs
//   BASE_URL=http://localhost:3001 node .claude/skills/run-majorille-garden/driver.mjs
//
// Requires the dev (or prod) server to be running first: `npm run dev`.
// Node 18+ (uses global fetch). Exit code 0 = all checks passed, 1 = failures.

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TIMEOUT_MS = 30_000;

let pass = 0;
let fail = 0;
const failures = [];

function ok(name) {
  pass++;
  console.log(`  \x1b[32m✓\x1b[0m ${name}`);
}
function bad(name, detail) {
  fail++;
  failures.push(`${name} — ${detail}`);
  console.log(`  \x1b[31m✗\x1b[0m ${name}\n      ${detail}`);
}

async function get(path, { redirect = "follow" } = {}) {
  const res = await fetch(BASE + path, {
    redirect,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "accept-language": "nl" },
  });
  const body = res.headers.get("content-type")?.startsWith("image/")
    ? ""
    : await res.text();
  return { status: res.status, body, headers: res.headers };
}

// Assert a route returns `status` and its HTML contains every needle.
async function check(name, path, status, needles = []) {
  try {
    const { status: got, body } = await get(path);
    if (got !== status) return bad(name, `expected ${status}, got ${got}  (${path})`);
    const missing = needles.filter((n) => !body.includes(n));
    if (missing.length) return bad(name, `missing in HTML: ${missing.map((m) => JSON.stringify(m)).join(", ")}`);
    ok(name);
  } catch (e) {
    bad(name, `request failed: ${e.message}`);
  }
}

async function checkRedirect(name, path, expectStatus, expectLocationIncludes) {
  try {
    const { status, headers } = await get(path, { redirect: "manual" });
    if (status !== expectStatus) return bad(name, `expected ${expectStatus}, got ${status}`);
    const loc = headers.get("location") ?? "";
    if (!loc.includes(expectLocationIncludes)) return bad(name, `location "${loc}" missing "${expectLocationIncludes}"`);
    ok(name);
  } catch (e) {
    bad(name, `request failed: ${e.message}`);
  }
}

async function checkContentType(name, path, ctPrefix) {
  try {
    const { status, headers } = await get(path);
    if (status !== 200) return bad(name, `expected 200, got ${status}`);
    const ct = headers.get("content-type") ?? "";
    if (!ct.startsWith(ctPrefix)) return bad(name, `content-type "${ct}" not "${ctPrefix}…"`);
    ok(name);
  } catch (e) {
    bad(name, `request failed: ${e.message}`);
  }
}

async function main() {
  console.log(`\nMajorille Garden smoke test → ${BASE}\n`);

  // Reachability first — fail fast with a helpful message.
  try {
    await get("/nl");
  } catch (e) {
    console.error(`\x1b[31mCannot reach ${BASE}.\x1b[0m Start the server first:  npm run dev`);
    console.error(`(${e.message})`);
    process.exit(1);
  }

  console.log("Routing & i18n");
  await checkRedirect("/ redirects to a locale", "/", 307, "/nl");
  await check("NL home renders", "/nl", 200, ["Majorille", "Marokkaanse"]);
  await check("EN home renders + translates", "/en", 200, ["Moroccan", "Treatments"]);

  console.log("\nServices (data-driven)");
  await check("Services index lists treatments", "/nl/services", 200, [
    "Warme Zandbad",
    "Bio Head Spa",
    "Dry Cupping",
  ]);
  await check("Service detail (NL) — copy + pricing", "/nl/services/bio-head-spa", 200, [
    "Bio Head Spa",
    "Souss-Massa",
    "application/ld+json", // ServiceJsonLd
  ]);
  await check("Service detail (EN) translation", "/en/services/warme-zandbad-therapie", 200, [
    "Warm Sand Bath",
  ]);
  await check("Unknown service → 404", "/nl/services/does-not-exist", 404, []);

  console.log("\nBooking (Cal.com)");
  await check("Booking page + audience selector", "/nl/booking", 200, ["Vrouwen", "Mannen"]);
  await check("Booking deep-link preselects service", "/nl/booking?service=bio-head-spa", 200, [
    "Bio Head Spa",
  ]);

  console.log("\nOther pages");
  await check("Contact form", "/nl/contact", 200, ['name="email"', 'name="message"']);
  await check("Shop catalog", "/nl/shop", 200, ["Arganolie"]);
  await check("Privacy (NL, AVG)", "/nl/privacy", 200, ["Privacyverklaring", "Autoriteit"]);
  await check("Terms (NL)", "/nl/terms", 200, ["voorwaarden"]);

  console.log("\nSEO & assets");
  await check("Home has JSON-LD LocalBusiness", "/nl", 200, [
    "application/ld+json",
    "HealthAndBeautyBusiness",
  ]);
  // NB: React renders the attribute as `hrefLang` (camelCase) in the HTML string;
  // crawlers read it case-insensitively. Match the literal output, not the spec spelling.
  await check("Home has hreflang alternates", "/nl", 200, ['hrefLang="en"', 'hrefLang="x-default"']);
  await check("sitemap.xml lists routes", "/sitemap.xml", 200, [
    "<loc>",
    "/nl/services/bio-head-spa",
  ]);
  await check("robots.txt points to sitemap", "/robots.txt", 200, ["Sitemap:", "Disallow: /admin"]);
  await checkContentType("OG image is a PNG", "/nl/opengraph-image", "image/png");
  await checkContentType("Favicon SVG", "/icon.svg", "image/svg");

  console.log("\nAdmin scaffold (Phase 2)");
  await checkRedirect("/admin redirects to login", "/admin", 307, "/admin/login");

  console.log(`\n${"─".repeat(48)}`);
  if (fail === 0) {
    console.log(`\x1b[32mAll ${pass} checks passed.\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m${fail} failed\x1b[0m, ${pass} passed:\n`);
    for (const f of failures) console.log(`  • ${f}`);
    console.log();
    process.exit(1);
  }
}

main();

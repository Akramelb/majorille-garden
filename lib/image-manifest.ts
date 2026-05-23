import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public", "images");
const ALLOWED = /\.(jpe?g|png|webp|avif|svg)$/i;

export type ImageGroup = { label: string; paths: string[] };

async function walk(dir: string, rel: string[]): Promise<string[]> {
  let out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      const next = [...rel, e.name];
      if (e.isDirectory()) {
        out = out.concat(await walk(full, next));
      } else if (e.isFile() && ALLOWED.test(e.name)) {
        out.push("/" + ["images", ...next].join("/"));
      }
    }
  } catch {
    /* dir missing — return empty */
  }
  return out;
}

/**
 * Group all images under /public/images/ by their first subdirectory
 * (home/about/services/products/contact/...) for use in the admin picker.
 */
export async function listPublicImages(): Promise<ImageGroup[]> {
  const paths = (await walk(PUBLIC_DIR, [])).sort();
  const groups = new Map<string, string[]>();
  for (const p of paths) {
    // p = "/images/<group>/...". For services/<slug>/file → group label "services / <slug>"
    const parts = p.split("/").filter(Boolean); // ["images", group, ...]
    const top = parts[1] ?? "other";
    const sub = parts.length > 3 ? parts[2] : null;
    const label = sub ? `${top} / ${sub}` : top;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(p);
  }
  return Array.from(groups, ([label, paths]) => ({ label, paths })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

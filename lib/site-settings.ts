import "server-only";
import { cache } from "react";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";

/**
 * Editable site overrides backed by Supabase. Single-row table keyed on
 * `id = 'default'` — there is exactly one site, so the schema avoids the
 * complexity of a multi-tenant settings store.
 *
 * Today this only stores override URLs for the three hero images, so the
 * parents can swap them from `/admin/images` without a redeploy. Each
 * consumer falls back to the static `/public/images/...` path baked at
 * build time when the override is null.
 *
 * Adding a new field:
 *   1. ALTER TABLE site_settings ADD COLUMN ... (see HANDOFF.md SQL block)
 *   2. Add the column to SiteSettings + columns whitelist below.
 *   3. Wire a default in the consumer.
 */

export type HeroSlot = "home" | "promo" | "about";

export type SiteSettings = {
  hero_home_url: string | null;
  hero_promo_url: string | null;
  hero_about_url: string | null;
  announcement_enabled: boolean;
  announcement_text_nl: string | null;
  announcement_text_en: string | null;
  updated_at: string | null;
};

const EMPTY: SiteSettings = {
  hero_home_url: null,
  hero_promo_url: null,
  hero_about_url: null,
  announcement_enabled: false,
  announcement_text_nl: null,
  announcement_text_en: null,
  updated_at: null,
};

const COLUMNS =
  "hero_home_url, hero_promo_url, hero_about_url, announcement_enabled, announcement_text_nl, announcement_text_en, updated_at";

/**
 * Wrapped in React cache() so the layout (announcement) and any number of
 * page-level consumers (hero slots) share ONE Supabase read per request —
 * previously the home page paid three round-trips for the same row.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!hasSupabaseConfig()) return EMPTY;
  try {
    const sb = getSupabaseServiceClient();
    const { data, error } = await sb
      .from("site_settings")
      .select(COLUMNS)
      .eq("id", "default")
      .maybeSingle();
    if (error) {
      console.error("[site-settings] read failed", error);
      return EMPTY;
    }
    return (data as SiteSettings | null) ?? EMPTY;
  } catch (err) {
    console.error("[site-settings] read threw", err);
    return EMPTY;
  }
});

const FALLBACKS: Record<HeroSlot, string> = {
  home: "/images/home/hero.jpg",
  promo: "/images/home/hero-promo.jpg",
  about: "/images/about/hero.jpg",
};

/**
 * Returns the override URL for a hero slot if one has been uploaded, else
 * the static `/public/images/...` path that ships with the build.
 */
export async function getHeroImageUrl(slot: HeroSlot): Promise<string> {
  const settings = await getSiteSettings();
  const key = `hero_${slot}_url` as const;
  return settings[key] ?? FALLBACKS[slot];
}

/**
 * Read the announcement bar config. Returns `null` if disabled or no text
 * — call sites can render conditionally without checking a flag separately.
 * The lang argument controls which translation is returned.
 */
export async function getAnnouncement(
  lang: "nl" | "en",
): Promise<string | null> {
  const settings = await getSiteSettings();
  if (!settings.announcement_enabled) return null;
  const text =
    lang === "en" ? settings.announcement_text_en : settings.announcement_text_nl;
  return text && text.trim() ? text.trim() : null;
}

/**
 * Persist the announcement bar config. Upserts the singleton row. All three
 * fields are required even when one is unchanged — the admin form posts the
 * full state so there's no merge ambiguity.
 */
export async function setAnnouncement(input: {
  enabled: boolean;
  textNl: string | null;
  textEn: string | null;
}): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    console.warn("[site-settings] supabase not configured — drop announcement");
    return false;
  }
  try {
    const sb = getSupabaseServiceClient();
    const { error } = await sb
      .from("site_settings")
      .upsert({
        id: "default",
        announcement_enabled: input.enabled,
        announcement_text_nl: input.textNl,
        announcement_text_en: input.textEn,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default");
    if (error) {
      console.error("[site-settings] announcement upsert failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[site-settings] announcement upsert threw", err);
    return false;
  }
}

/**
 * Persist an override URL (or null to clear back to the static fallback).
 * Upserts the singleton row. Returns true on success, false on failure —
 * caller decides whether to surface that to the admin UI.
 */
export async function setHeroImageUrl(
  slot: HeroSlot,
  url: string | null,
): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    console.warn("[site-settings] supabase not configured — drop write", {
      slot,
    });
    return false;
  }
  try {
    const sb = getSupabaseServiceClient();
    const column = `hero_${slot}_url`;
    const { error } = await sb
      .from("site_settings")
      .upsert({ id: "default", [column]: url, updated_at: new Date().toISOString() })
      .eq("id", "default");
    if (error) {
      console.error("[site-settings] upsert failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[site-settings] upsert threw", err);
    return false;
  }
}

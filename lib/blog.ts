import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";
import type { Locale } from "@/app/[lang]/dictionaries";

export type BlogPost = {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  published: boolean;
  cover_image: string | null;
  title_nl: string;
  title_en: string;
  excerpt_nl: string | null;
  excerpt_en: string | null;
  body_nl: string;
  body_en: string;
};

export function postTitle(p: BlogPost, locale: Locale): string {
  return locale === "nl" ? p.title_nl : p.title_en;
}
export function postExcerpt(p: BlogPost, locale: Locale): string {
  return (locale === "nl" ? p.excerpt_nl : p.excerpt_en) ?? "";
}
export function postBody(p: BlogPost, locale: Locale): string {
  return locale === "nl" ? p.body_nl : p.body_en;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[blog] read failed", error.message);
    return [];
  }
  return (data as BlogPost[]) ?? [];
}

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  return (data as BlogPost[]) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabaseServiceClient();
  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogPost) ?? null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabaseServiceClient();
  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as BlogPost) ?? null;
}

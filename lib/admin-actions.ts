"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "./supabase/auth-server";
import { getSupabaseServiceClient } from "./supabase";
import type { ReviewStatus } from "./reviews";

function postFieldsFromForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    slug: str("slug")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    cover_image: str("cover_image") || null,
    title_nl: str("title_nl"),
    title_en: str("title_en"),
    excerpt_nl: str("excerpt_nl") || null,
    excerpt_en: str("excerpt_en") || null,
    body_nl: str("body_nl"),
    body_en: str("body_en"),
    published: formData.get("published") === "on",
  };
}

function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/nl/journal");
  revalidatePath("/en/journal");
}

export async function createPost(formData: FormData) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const fields = postFieldsFromForm(formData);
  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("blog_posts").insert(fields);
  if (error) return; // slug clash etc.; editor stays on page
  revalidateBlog();
  redirect("/admin/blog");
}

export async function updatePost(formData: FormData) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const fields = postFieldsFromForm(formData);
  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("blog_posts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;
  revalidateBlog();
  revalidatePath(`/nl/journal/${fields.slug}`);
  revalidatePath(`/en/journal/${fields.slug}`);
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  const user = await getAdminUser();
  if (!user) return { ok: false };
  const sb = getSupabaseServiceClient();
  await sb.from("blog_posts").delete().eq("id", id);
  revalidateBlog();
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// FAQ admin actions

function faqFieldsFromForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    question_nl: str("question_nl"),
    question_en: str("question_en"),
    answer_nl: str("answer_nl"),
    answer_en: str("answer_en"),
    active: formData.get("active") === "on",
  };
}

function revalidateFAQs() {
  revalidatePath("/admin/faq");
  revalidatePath("/nl");
  revalidatePath("/en");
}

export async function createFAQ(formData: FormData) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const fields = faqFieldsFromForm(formData);
  const sb = getSupabaseServiceClient();
  // Append to the end: max(sort_order) + 10
  const { data: maxRow } = await sb
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = ((maxRow?.sort_order as number | undefined) ?? 0) + 10;
  const { error } = await sb.from("faqs").insert({ ...fields, sort_order });
  if (error) return;
  revalidateFAQs();
  redirect("/admin/faq");
}

export async function updateFAQ(formData: FormData) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const fields = faqFieldsFromForm(formData);
  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("faqs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;
  revalidateFAQs();
  redirect("/admin/faq");
}

export async function deleteFAQ(id: string) {
  const user = await getAdminUser();
  if (!user) return { ok: false };
  const sb = getSupabaseServiceClient();
  await sb.from("faqs").delete().eq("id", id);
  revalidateFAQs();
  return { ok: true };
}

/**
 * Swap two FAQs' sort_order. `direction = -1` moves the row up (toward smaller
 * sort_order), `+1` moves it down. Reads the neighbor and swaps values atomically
 * in two updates (good enough for low-volume admin use).
 */
export async function moveFAQ(id: string, direction: -1 | 1) {
  const user = await getAdminUser();
  if (!user) return { ok: false };
  const sb = getSupabaseServiceClient();
  const { data: rows } = await sb
    .from("faqs")
    .select("id,sort_order")
    .order("sort_order", { ascending: true });
  if (!rows) return { ok: false };
  const idx = rows.findIndex((r) => r.id === id);
  const swap = rows[idx + direction];
  if (idx < 0 || !swap) return { ok: false };
  const me = rows[idx];
  await sb.from("faqs").update({ sort_order: swap.sort_order }).eq("id", me.id);
  await sb.from("faqs").update({ sort_order: me.sort_order }).eq("id", swap.id);
  revalidateFAQs();
  return { ok: true };
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("reviews").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/reviews");
  revalidatePath("/nl/reviews");
  revalidatePath("/en/reviews");
  revalidatePath("/nl");
  revalidatePath("/en");
  return { ok: true, message: "updated" };
}

export async function setPostPublished(id: string, published: boolean) {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("blog_posts")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/blog");
  revalidatePath("/nl/journal");
  revalidatePath("/en/journal");
  return { ok: true, message: "updated" };
}

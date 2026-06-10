"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "./supabase/auth-server";
import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";
import { centsToEuroString, getMollieClient, hasMollieConfig } from "./mollie";
import { getOrderById, updateOrder } from "./orders";
import type { ReviewStatus } from "./reviews";
import { setAnnouncement, setHeroImageUrl, type HeroSlot } from "./site-settings";

const HERO_SLOTS = new Set<HeroSlot>(["home", "promo", "about"]);
const HERO_BUCKET = "site-images";
const HERO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — sharp-compressed JPGs fit comfortably
const HERO_MIME_WHITELIST = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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

export async function refundOrder(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  if (!hasMollieConfig() || !hasSupabaseConfig()) {
    return { ok: false, message: "payments-disabled" };
  }
  const order = await getOrderById(orderId);
  if (!order || !order.mollie_payment_id) return { ok: false, message: "not-found" };
  if (order.status !== "paid") return { ok: false, message: "not-refundable" };
  try {
    const mollie = getMollieClient();
    await mollie.paymentRefunds.create({
      paymentId: order.mollie_payment_id,
      amount: {
        value: centsToEuroString(order.amount_cents),
        currency: order.currency,
      },
    });
    await updateOrder(orderId, { status: "refunded" });
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (err) {
    console.error("refundOrder failed", err);
    return { ok: false, message: "internal-error" };
  }
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

// ────────────────────────────────────────────────────────────────
// Hero image override — admin can swap the home/promo/about heroes
// without touching the repo. Files land in the `site-images` Supabase
// Storage bucket (public read); the URL is stored on the singleton
// `site_settings` row. Consumers read via `getHeroImageUrl(slot)` and
// fall back to the static `/public/images/...` path baked at build.

export type HeroUploadResult = {
  ok: boolean;
  message: string;
} | null;

export async function uploadHeroImage(
  _prev: HeroUploadResult,
  formData: FormData,
): Promise<HeroUploadResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };

  const slotRaw = String(formData.get("slot") ?? "");
  const file = formData.get("file");
  if (!HERO_SLOTS.has(slotRaw as HeroSlot)) {
    return { ok: false, message: "invalid-slot" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "no-file" };
  }
  if (file.size > HERO_MAX_BYTES) {
    return { ok: false, message: "file-too-large" };
  }
  if (!HERO_MIME_WHITELIST.has(file.type)) {
    return { ok: false, message: "invalid-type" };
  }
  if (!hasSupabaseConfig()) {
    return { ok: false, message: "supabase-not-configured" };
  }

  const slot = slotRaw as HeroSlot;
  // Cache-buster in the path so a re-upload to the same slot immediately
  // wins; the old object lingers in the bucket but next/image won't fetch
  // it (the DB row points at the new URL). Periodic cleanup is fine.
  const extFromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : extFromName === "png" || extFromName === "webp"
          ? extFromName
          : "jpg";
  const objectPath = `heroes/${slot}-${Date.now()}.${ext}`;

  try {
    const sb = getSupabaseServiceClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await sb.storage
      .from(HERO_BUCKET)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadErr) {
      console.error("[hero-upload] storage upload failed", uploadErr);
      return { ok: false, message: uploadErr.message };
    }
    const { data: publicUrlData } = sb.storage
      .from(HERO_BUCKET)
      .getPublicUrl(objectPath);
    const url = publicUrlData.publicUrl;

    const saved = await setHeroImageUrl(slot, url);
    if (!saved) {
      return { ok: false, message: "settings-write-failed" };
    }

    revalidatePath("/admin/images");
    revalidatePath("/nl");
    revalidatePath("/en");
    revalidatePath("/nl/about");
    revalidatePath("/en/about");

    return { ok: true, message: "uploaded" };
  } catch (err) {
    console.error("[hero-upload] threw", err);
    return { ok: false, message: "internal-error" };
  }
}

// ────────────────────────────────────────────────────────────────
// Announcement bar — scrolling top bar with admin-editable middle slot.
// Phone + email are pulled from SITE constants (rarely change); the slot
// in the middle is whatever the parents type in /admin/banner.

export type AnnouncementResult = {
  ok: boolean;
  message: string;
} | null;

export async function updateAnnouncement(
  _prev: AnnouncementResult,
  formData: FormData,
): Promise<AnnouncementResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };

  const enabled = formData.get("enabled") === "on";
  const textNl = String(formData.get("text_nl") ?? "").trim() || null;
  const textEn = String(formData.get("text_en") ?? "").trim() || null;

  // Both languages must be present if the bar is enabled — otherwise visitors
  // in the missing locale get a blank center slot. We allow turning it on
  // with only NL filled if you really want, but reject completely empty.
  if (enabled && !textNl && !textEn) {
    return { ok: false, message: "missing-text" };
  }
  if ((textNl && textNl.length > 200) || (textEn && textEn.length > 200)) {
    return { ok: false, message: "too-long" };
  }

  const saved = await setAnnouncement({ enabled, textNl, textEn });
  if (!saved) return { ok: false, message: "settings-write-failed" };

  // Bust both locales' layouts — the bar's mount lives in app/[lang]/layout.tsx
  // so a tag-level revalidate is overkill; per-path is enough.
  revalidatePath("/admin/banner");
  revalidatePath("/nl", "layout");
  revalidatePath("/en", "layout");

  return { ok: true, message: "saved" };
}

export async function clearHeroImage(
  _prev: HeroUploadResult,
  formData: FormData,
): Promise<HeroUploadResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, message: "unauthorized" };
  const slotRaw = String(formData.get("slot") ?? "");
  if (!HERO_SLOTS.has(slotRaw as HeroSlot)) {
    return { ok: false, message: "invalid-slot" };
  }
  const saved = await setHeroImageUrl(slotRaw as HeroSlot, null);
  if (!saved) return { ok: false, message: "settings-write-failed" };
  revalidatePath("/admin/images");
  revalidatePath("/nl");
  revalidatePath("/en");
  revalidatePath("/nl/about");
  revalidatePath("/en/about");
  return { ok: true, message: "cleared" };
}

"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "./supabase/auth-server";
import { getSupabaseServiceClient } from "./supabase";
import type { ReviewStatus } from "./reviews";

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

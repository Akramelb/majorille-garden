import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  created_at: string;
  author_name: string;
  rating: number;
  body: string;
  service_slug: string | null;
  locale: string;
  status: ReviewStatus;
};

export async function getApprovedReviews(limit = 24): Promise<Review[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[reviews] read failed", error.message);
    return [];
  }
  return (data as Review[]) ?? [];
}

export async function getReviewsByStatus(
  status: ReviewStatus,
  limit = 100,
): Promise<Review[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data } = await sb
    .from("reviews")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Review[]) ?? [];
}

export type ReviewStats = { count: number; avg: number };

export async function getReviewStats(): Promise<ReviewStats | null> {
  const reviews = await getApprovedReviews(1000);
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { count: reviews.length, avg: Math.round(avg * 10) / 10 };
}

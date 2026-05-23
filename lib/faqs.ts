import "server-only";
import { FAQS as FILE_FAQS, type FAQ } from "./content";
import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";

export type FAQRow = {
  id: string;
  created_at: string;
  updated_at: string;
  question_nl: string;
  question_en: string;
  answer_nl: string;
  answer_en: string;
  sort_order: number;
  active: boolean;
};

function rowToFAQ(r: FAQRow): FAQ {
  return {
    question: { nl: r.question_nl, en: r.question_en },
    answer: { nl: r.answer_nl, en: r.answer_en },
  };
}

/**
 * Public-facing FAQs. Reads from the `faqs` table; if Supabase isn't
 * configured, the read fails, or the table is empty, falls back to the
 * file-based FAQS in lib/content.ts so the page never goes blank.
 */
export async function getActiveFAQs(): Promise<FAQ[]> {
  if (!hasSupabaseConfig()) return FILE_FAQS;
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("faqs")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[faqs] read failed, using file fallback:", error.message);
    return FILE_FAQS;
  }
  if (!data || data.length === 0) return FILE_FAQS;
  return (data as FAQRow[]).map(rowToFAQ);
}

/** Admin view: all rows including inactive, ordered. */
export async function getAllFAQs(): Promise<FAQRow[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabaseServiceClient();
  const { data } = await sb
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as FAQRow[]) ?? [];
}

export async function getFAQById(id: string): Promise<FAQRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabaseServiceClient();
  const { data } = await sb.from("faqs").select("*").eq("id", id).maybeSingle();
  return (data as FAQRow) ?? null;
}

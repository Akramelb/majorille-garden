import "server-only";
import { getSupabaseServiceClient, hasSupabaseConfig } from "./supabase";

/**
 * Mask an email for log output — keeps domain + first/last local-part char,
 * stars out the middle. Duplicated from lib/actions.ts because that file is
 * "use server" (every export must be async); this helper is sync.
 */
function maskEmail(e: string): string {
  if (!e || !e.includes("@")) return "<no-email>";
  const [user, domain] = e.split("@");
  const u =
    user.length <= 2
      ? user[0] + "*"
      : user[0] + "*".repeat(user.length - 2) + user[user.length - 1];
  return `${u}@${domain}`;
}

export type OrderKind = "product" | "booking";
export type OrderStatus =
  | "open"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "canceled"
  | "expired"
  | "refunded";

export type OrderLineItem = {
  slug: string;
  qty: number;
  unit_cents: number;
  name_nl: string;
  name_en: string;
};

export type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string | null;
  postal_code?: string;
  city?: string;
  country?: string;
  [key: string]: unknown;
};

export type Order = {
  id: string;
  created_at: string;
  updated_at: string;
  kind: OrderKind;
  amount_cents: number;
  currency: string;
  mollie_payment_id: string | null;
  checkout_url: string | null;
  status: OrderStatus;
  paid_at: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  locale: "nl" | "en";
  service_slug: string | null;
  booking_slug: string | null;
  audience: "women" | "men" | null;
  variant_idx: number | null;
  line_items: OrderLineItem[] | null;
  shipping_address: ShippingAddress | null;
  notes: string | null;
};

/**
 * Fields supplied at order creation time. The mollie_payment_id, checkout_url,
 * status, and paid_at fields are filled in later by the checkout/webhook flow.
 */
export type NewOrder = {
  kind: OrderKind;
  amount_cents: number;
  customer_email: string;
  // Optional at creation — sensible defaults applied by the database
  currency?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  locale?: "nl" | "en";
  service_slug?: string | null;
  booking_slug?: string | null;
  audience?: "women" | "men" | null;
  variant_idx?: number | null;
  line_items?: OrderLineItem[] | null;
  shipping_address?: ShippingAddress | null;
  notes?: string | null;
};

function mapRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    kind: row.kind as OrderKind,
    amount_cents: Number(row.amount_cents),
    currency: String(row.currency ?? "EUR"),
    mollie_payment_id: (row.mollie_payment_id as string | null) ?? null,
    checkout_url: (row.checkout_url as string | null) ?? null,
    status: (row.status as OrderStatus) ?? "open",
    paid_at: (row.paid_at as string | null) ?? null,
    customer_email: String(row.customer_email),
    customer_name: (row.customer_name as string | null) ?? null,
    customer_phone: (row.customer_phone as string | null) ?? null,
    locale: ((row.locale as "nl" | "en") ?? "nl"),
    service_slug: (row.service_slug as string | null) ?? null,
    booking_slug: (row.booking_slug as string | null) ?? null,
    audience: (row.audience as "women" | "men" | null) ?? null,
    variant_idx:
      row.variant_idx === null || row.variant_idx === undefined
        ? null
        : Number(row.variant_idx),
    line_items: (row.line_items as OrderLineItem[] | null) ?? null,
    shipping_address: (row.shipping_address as ShippingAddress | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

export async function createOrder(input: NewOrder): Promise<Order | null> {
  if (!hasSupabaseConfig()) {
    console.warn("[orders] Supabase not configured — createOrder discarded", {
      kind: input.kind,
      amount_cents: input.amount_cents,
      email: maskEmail(input.customer_email),
    });
    return null;
  }
  const sb = getSupabaseServiceClient();
  const payload: Record<string, unknown> = {
    kind: input.kind,
    amount_cents: input.amount_cents,
    customer_email: input.customer_email,
    status: "open",
  };
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.customer_name !== undefined) payload.customer_name = input.customer_name;
  if (input.customer_phone !== undefined) payload.customer_phone = input.customer_phone;
  if (input.locale !== undefined) payload.locale = input.locale;
  if (input.service_slug !== undefined) payload.service_slug = input.service_slug;
  if (input.booking_slug !== undefined) payload.booking_slug = input.booking_slug;
  if (input.audience !== undefined) payload.audience = input.audience;
  if (input.variant_idx !== undefined) payload.variant_idx = input.variant_idx;
  if (input.line_items !== undefined) payload.line_items = input.line_items;
  if (input.shipping_address !== undefined) payload.shipping_address = input.shipping_address;
  if (input.notes !== undefined) payload.notes = input.notes;

  const { data, error } = await sb
    .from("orders")
    .insert(payload)
    .select()
    .single();
  if (error) {
    console.error("[orders] insert failed", error);
    return null;
  }
  return mapRow(data as Record<string, unknown>);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!hasSupabaseConfig()) {
    console.warn("[orders] Supabase not configured — getOrderById returning null");
    return null;
  }
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[orders] getOrderById failed", error);
    return null;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function getOrderByMolliePaymentId(
  pid: string,
): Promise<Order | null> {
  if (!hasSupabaseConfig()) {
    console.warn(
      "[orders] Supabase not configured — getOrderByMolliePaymentId returning null",
    );
    return null;
  }
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("mollie_payment_id", pid)
    .maybeSingle();
  if (error) {
    console.error("[orders] getOrderByMolliePaymentId failed", error);
    return null;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function updateOrder(
  id: string,
  patch: Partial<
    Pick<Order, "mollie_payment_id" | "checkout_url" | "status" | "paid_at">
  >,
): Promise<void> {
  if (!hasSupabaseConfig()) {
    console.warn("[orders] Supabase not configured — updateOrder no-op", {
      id,
      fields: Object.keys(patch),
    });
    return;
  }
  const sb = getSupabaseServiceClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.mollie_payment_id !== undefined)
    payload.mollie_payment_id = patch.mollie_payment_id;
  if (patch.checkout_url !== undefined) payload.checkout_url = patch.checkout_url;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.paid_at !== undefined) payload.paid_at = patch.paid_at;
  const { error } = await sb.from("orders").update(payload).eq("id", id);
  if (error) {
    console.error("[orders] updateOrder failed", error);
  }
}

/**
 * Conditional update — only writes if current status differs from newStatus.
 * Returns true if a row was changed. Used by the Mollie webhook so a duplicate
 * "paid" delivery can't re-fire side effects (emails, etc.) — only the first
 * transition into a new status returns true.
 */
export async function updateOrderStatusIfChanged(
  id: string,
  newStatus: OrderStatus,
  paidAtIso: string | null,
): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    console.warn("[orders] supabase unset, status update skipped");
    return false;
  }
  const sb = getSupabaseServiceClient();
  const { data, error } = await sb
    .from("orders")
    .update({
      status: newStatus,
      paid_at: paidAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .neq("status", newStatus)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[orders] updateOrderStatusIfChanged", error);
    return false;
  }
  return !!data;
}

export async function listOrders(opts?: {
  kind?: OrderKind;
  limit?: number;
}): Promise<Order[]> {
  if (!hasSupabaseConfig()) {
    console.warn("[orders] Supabase not configured — listOrders returning []");
    return [];
  }
  const sb = getSupabaseServiceClient();
  let query = sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) {
    console.error("[orders] listOrders failed", error);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

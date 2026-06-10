import {
  orderCustomerHtml,
  orderOwnerHtml,
  sendCustomerEmail,
  sendOwnerEmail,
} from "@/lib/email";
import { getMollieClient, hasMollieConfig } from "@/lib/mollie";
import {
  getOrderByMolliePaymentId,
  updateOrderStatusIfChanged,
  type OrderStatus,
} from "@/lib/orders";
import { checkRateLimit } from "@/lib/ratelimit";
import { hasSupabaseConfig } from "@/lib/supabase";
import { SITE } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * Map a Mollie payment status to our internal OrderStatus.
 * Mollie's "open" maps to our "pending" — once we've redirected the user to
 * checkout we don't carry "open" through any longer. Every other Mollie status
 * happens to share its name with ours.
 */
function mapStatus(mollieStatus: string | undefined): OrderStatus {
  switch (mollieStatus) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "expired":
      return "expired";
    case "authorized":
      return "authorized";
    case "pending":
      return "pending";
    case "open":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Mollie webhook handler. Mollie POSTs `id=tr_xxx` as form-urlencoded; we then
 * re-fetch the payment via the SDK (Rule 22 — never trust webhook body alone)
 * and reconcile the matching `orders` row. We always reply 200, even on
 * error, to avoid Mollie's 24-hour retry storm; failures are loud in logs.
 *
 * Ordering matters here:
 *   1. content-type guard (cheap)
 *   2. rate-limit per IP (still 200 on rejection — never 4xx/5xx to Mollie)
 *   3. local DB lookup by mollie_payment_id (cheap, scoped to our rows)
 *   4. only THEN re-fetch from Mollie SDK
 *
 * Step 3 before step 4 means an attacker spamming random `id=tr_xxx` doesn't
 * trigger outbound Mollie API calls — we exit at the local lookup.
 */
export async function POST(req: Request): Promise<Response> {
  // Content-type guard — Mollie always POSTs application/x-www-form-urlencoded.
  // Reject anything else early to cut spurious / probing traffic before we
  // bother parsing a body or hitting the SDK. Reply 200 either way: a non-200
  // triggers Mollie's 24h retry storm and we never want that for non-Mollie
  // callers. (Keep this guard FIRST.)
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.startsWith("application/x-www-form-urlencoded")) {
    return new Response("ok", { status: 200 });
  }

  // Rate-limit per IP. On hit, still reply 200 — never 4xx/5xx to Mollie.
  const rl = await checkRateLimit("webhook");
  if (!rl.ok) {
    return new Response("ok", { status: 200 });
  }

  try {
    const form = await req.formData();
    const id = String(form.get("id") ?? "");
    if (!id) {
      return new Response("ok", { status: 200 });
    }

    if (!hasMollieConfig() || !hasSupabaseConfig()) {
      console.warn(
        "[mollie-webhook] Mollie or Supabase not configured — ignoring webhook",
        { id },
      );
      return new Response("ok", { status: 200 });
    }

    // Local lookup FIRST — if the payment id matches no row of ours, drop
    // before calling Mollie. Stops random `id=tr_xxx` from triggering
    // outbound SDK calls.
    const order = await getOrderByMolliePaymentId(id);
    if (!order) {
      // Mollie may webhook for a payment we have no row for (test traffic,
      // a payment that failed to persist locally). Acknowledge silently.
      console.warn("[mollie-webhook] no order found for payment", { id });
      return new Response("ok", { status: 200 });
    }

    // Re-fetch via SDK (fraud prevention — body alone could be forged).
    const payment = await getMollieClient().payments.get(id);

    const newStatus = mapStatus(payment.status);
    const wasPaid = order.status === "paid";
    const isPaidNow = newStatus === "paid";

    const paidAtIso = payment.paidAt
      ? new Date(payment.paidAt).toISOString()
      : null;

    // Atomic flip: only writes when status actually changes. Returns true
    // when a row was updated. We gate the side-effect emails on `changed`
    // so a duplicate "paid" webhook (Mollie retries) can't re-send.
    const changed = await updateOrderStatusIfChanged(
      order.id,
      newStatus,
      paidAtIso,
    );

    // Fire-and-forget customer + owner emails only on the *first* paid
    // transition. `changed` guarantees we won the race; (!wasPaid && isPaidNow)
    // narrows to the open→paid edge specifically.
    if (changed && !wasPaid && isPaidNow) {
      const paidOrder = {
        ...order,
        status: "paid" as const,
        paid_at: paidAtIso,
      };
      void sendOwnerEmail({
        subject: `Betaling ontvangen: ${order.kind} order ${order.id.slice(0, 8)}`,
        html: orderOwnerHtml(paidOrder),
        // Hitting Reply on the owner notification opens a draft to the
        // customer — fastest manual-followup path for the parents.
        replyTo: order.customer_email,
        relatedOrderId: order.id,
        relatedKind: order.kind,
      });
      void sendCustomerEmail({
        to: order.customer_email,
        subject:
          order.kind === "booking"
            ? "Plan je afspraak / Schedule your appointment"
            : "Bestelling ontvangen / Order received",
        html: orderCustomerHtml(paidOrder, order.locale),
        // Customer Reply routes to info@majorillegarden.nl instead of bouncing
        // off the noreply From address.
        replyTo: SITE.email,
        // Booking customer mail is a CTA to the Cal.com link, not a generic
        // confirmation — discriminate in the audit log accordingly.
        logKind:
          order.kind === "booking"
            ? "customer_booking_link"
            : "customer_order_confirmation",
        relatedOrderId: order.id,
        relatedKind: order.kind,
      });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    // Log loud, reply 200 — Mollie retries for 24h on non-2xx and we don't
    // want a transient SDK/DB error to compound into a retry storm.
    console.error("[mollie-webhook] handler failed", err);
    return new Response("ok", { status: 200 });
  }
}

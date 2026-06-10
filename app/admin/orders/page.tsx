import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { listOrders, type Order, type OrderStatus } from "@/lib/orders";
import { getServiceBySlug } from "@/lib/content";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { RefundButton } from "./OrderRow";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  // listOrders gracefully returns [] when Supabase env is missing (rule 14).
  const orders = await listOrders({ limit: 200 });
  const bookings = orders.filter((o) => o.kind === "booking");
  const products = orders.filter((o) => o.kind === "product");

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Orders"
        description="Bestellingen en boekingen — paid, pending en refunded."
      >
        <div className="space-y-12">
          <Group title={`Boekingen (${bookings.length})`}>
            {bookings.length === 0 ? (
              <Empty>Nog geen boekingen.</Empty>
            ) : (
              <div className="space-y-3">
                {bookings.map((o) => (
                  <BookingRow key={o.id} order={o} />
                ))}
              </div>
            )}
          </Group>
          <Group title={`Producten (${products.length})`}>
            {products.length === 0 ? (
              <Empty>Nog geen productbestellingen.</Empty>
            ) : (
              <div className="space-y-3">
                {products.map((o) => (
                  <ProductRow key={o.id} order={o} />
                ))}
              </div>
            )}
          </Group>
        </div>
      </AdminPage>
    </AdminShell>
  );
}

// ───────────────────────────────────────────────────────────────
// Per-row server components

function BookingRow({ order }: { order: Order }) {
  const svc = order.service_slug ? getServiceBySlug(order.service_slug) : null;
  const audienceLabel =
    order.audience === "men"
      ? "Men"
      : order.audience === "women"
        ? "Women"
        : null;
  return (
    <article className="bg-cream border border-border/50 rounded-sm p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1 w-full">
          <p className="text-deep-brown font-medium text-sm break-words">
            <span className="break-words">{order.customer_name ?? "—"}</span>
            {" — "}
            <a
              href={`mailto:${order.customer_email}`}
              title={order.customer_email ?? undefined}
              className="text-terracotta text-sm hover:underline break-all"
            >
              {order.customer_email}
            </a>
            {order.customer_phone && (
              <span className="text-muted text-sm break-all">
                {" · "}
                {order.customer_phone}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted flex flex-wrap items-center gap-2">
            {svc && (
              <span className="uppercase tracking-[0.14em] text-terracotta">
                {svc.name.nl}
              </span>
            )}
            {audienceLabel && <AudiencePill label={audienceLabel} />}
            {order.variant_idx !== null && (
              <span>variant #{order.variant_idx + 1}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={order.status} />
          <p className="text-deep-brown font-medium text-sm">
            {fmtAmount(order)}
          </p>
        </div>
      </header>
      <footer className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 text-xs text-muted">
        <span className="min-w-0 break-all">
          {fmtDate(order.created_at)}
          {order.mollie_payment_id && (
            <>
              {" · "}
              <span className="font-mono break-all">{order.mollie_payment_id}</span>
            </>
          )}
        </span>
        {order.status === "paid" && (
          <div className="w-full sm:w-auto">
            <RefundButton orderId={order.id} />
          </div>
        )}
      </footer>
    </article>
  );
}

function ProductRow({ order }: { order: Order }) {
  const itemsSummary =
    order.line_items && order.line_items.length > 0
      ? order.line_items
          .map((li) => `${li.qty}× ${li.name_nl}`)
          .join(" + ")
      : "—";
  const addr = fmtAddress(order.shipping_address);
  return (
    <article className="bg-cream border border-border/50 rounded-sm p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1 w-full">
          <p className="text-deep-brown font-medium text-sm break-words">
            <span className="break-words">{order.customer_name ?? "—"}</span>
            {" — "}
            <a
              href={`mailto:${order.customer_email}`}
              title={order.customer_email ?? undefined}
              className="text-terracotta text-sm hover:underline break-all"
            >
              {order.customer_email}
            </a>
            {order.customer_phone && (
              <span className="text-muted text-sm break-all">
                {" · "}
                {order.customer_phone}
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted break-words">{itemsSummary}</p>
          {addr && <p className="mt-1 text-xs text-muted break-words">{addr}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={order.status} />
          <p className="text-deep-brown font-medium text-sm">
            {fmtAmount(order)}
          </p>
        </div>
      </header>
      <footer className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 text-xs text-muted">
        <span className="min-w-0 break-all">
          {fmtDate(order.created_at)}
          {order.mollie_payment_id && (
            <>
              {" · "}
              <span className="font-mono break-all">{order.mollie_payment_id}</span>
            </>
          )}
        </span>
        {order.status === "paid" && (
          <div className="w-full sm:w-auto">
            <RefundButton orderId={order.id} />
          </div>
        )}
      </footer>
    </article>
  );
}

// ───────────────────────────────────────────────────────────────
// Helpers + small presentational components

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="serif text-2xl text-deep-brown mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-sm py-4 px-5 bg-sand/30 border border-border/30 rounded-sm">
      {children}
    </p>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  // Color rules per spec: paid=olive, pending/open=sand,
  // failed/canceled/expired=terracotta, refunded=muted.
  const cls =
    status === "paid"
      ? "bg-olive text-cream"
      : status === "pending" || status === "open" || status === "authorized"
        ? "bg-sand text-deep-brown"
        : status === "refunded"
          ? "bg-cream text-muted border border-border"
          : "bg-terracotta text-cream";
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm ${cls}`}
    >
      {status}
    </span>
  );
}

function AudiencePill({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 bg-sand/60 text-deep-brown rounded-sm">
      {label}
    </span>
  );
}

function fmtAmount(order: Order): string {
  // Format at the render boundary only (rule 17).
  return new Intl.NumberFormat(order.locale === "en" ? "en-IE" : "nl-NL", {
    style: "currency",
    currency: order.currency,
  }).format(order.amount_cents / 100);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function fmtAddress(
  addr: Order["shipping_address"],
): string | null {
  if (!addr) return null;
  const line1 = addr.line1?.trim();
  const line2 = addr.line2?.trim();
  const postal = addr.postal_code?.trim();
  const city = addr.city?.trim();
  const street = line1
    ? line2
      ? `${line1}, ${line2}`
      : line1
    : null;
  const tail = [postal, city].filter(Boolean).join(" ");
  const parts = [street, tail].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

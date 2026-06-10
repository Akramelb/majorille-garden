"use server";

// Thin wrapper: client components can't import from `lib/admin-actions`
// directly because that module is "use server" too — but more importantly we
// keep the surface bound to this route, mirroring the page's revalidation
// scope. Delegates straight to the canonical implementation, which re-checks
// `getAdminUser()` and gates on env (rules 13 + 14).
import { refundOrder } from "@/lib/admin-actions";

export async function refundOrderAction(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  return refundOrder(orderId);
}

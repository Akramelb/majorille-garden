import { redirect } from "next/navigation";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { listPromos } from "@/lib/promos";
import { PromoCreateForm } from "./PromoCreateForm";
import { PromoRow } from "./PromoRow";

export const dynamic = "force-dynamic";

/**
 * Promo code manager. Two cross-sell codes (`BEDANKT10`, `BOEK10`) are seeded
 * via the SQL block in HANDOFF.md so the upsell banners on the return pages
 * work out of the box. Parents can add seasonal codes here (`KERST20`,
 * `LENTE15`) without a redeploy.
 *
 * Codes are scoped by `applies` (product / booking) — a customer pasting
 * BOEK10 into the shop form won't get a discount because the server-side
 * `applyPromo` check rejects mismatched kinds.
 */
export default async function AdminPromosPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const promos = await listPromos();

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Kortingscodes"
        description="Beheer kortingscodes voor de shop en boekingen. Wijzigingen zijn direct zichtbaar op de site."
      >
        <div className="space-y-12">
          <section>
            <h2 className="serif text-xl text-deep-brown mb-5">
              Bestaande codes
            </h2>
            {promos.length === 0 ? (
              <p className="text-sm text-muted bg-sand/30 border border-border/40 p-5">
                Nog geen kortingscodes. Voeg er hieronder een toe of run de
                seed SQL uit HANDOFF.md voor de twee standaard cross-sell
                codes (BEDANKT10 + BOEK10).
              </p>
            ) : (
              <div className="space-y-3">
                {promos.map((p) => (
                  <PromoRow key={p.id} promo={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="serif text-xl text-deep-brown mb-5">
              Nieuwe code toevoegen
            </h2>
            <PromoCreateForm />
          </section>

          <aside className="bg-sand/30 border border-border/40 p-5 text-sm text-muted leading-relaxed max-w-2xl">
            <p className="text-deep-brown font-medium mb-2">Hoe werken codes?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Producten</strong>: code geldt bij shop-checkout. Klant
                ziet de code bij &ldquo;Cadeautje&rdquo; banner op
                /booking/return.
              </li>
              <li>
                <strong>Boekingen</strong>: code geldt bij booking-checkout.
                Klant ziet de code bij &ldquo;Cadeautje&rdquo; banner op
                /shop/return.
              </li>
              <li>
                <strong>Inactief</strong> = code werkt niet meer, maar blijft
                in de lijst voor de geschiedenis. Verwijderen kan ook (verdwijnt
                permanent).
              </li>
              <li>
                <strong>Verloopdatum</strong> is optioneel. Leeg = altijd
                geldig.
              </li>
            </ul>
          </aside>
        </div>
      </AdminPage>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSiteSettings } from "@/lib/site-settings";
import { BannerForm } from "./BannerForm";

export const dynamic = "force-dynamic";

/**
 * Announcement bar manager. Edits the singleton `site_settings` row — the
 * three columns `announcement_enabled / _text_nl / _text_en` drive the
 * scrolling bar at the top of every page. Disabling collapses `--bar-h`
 * to 0 so the header sits flush against the viewport again.
 *
 * Phone + email next to the middle text aren't editable here — they come
 * from `SITE.phone` / `SITE.email` in `lib/content.ts` because they almost
 * never change. If you DO want them admin-editable later, add columns to
 * site_settings and read them in `AnnouncementBar`.
 */
export default async function AdminBannerPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const settings = await getSiteSettings();

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Bovenbalk"
        description="De smalle balk bovenaan elke pagina. Telefoon + e-mail komen automatisch uit de site-instellingen — de middelste tekst pas je hier aan."
      >
        <div className="max-w-2xl space-y-8">
          <BannerForm
            initialEnabled={settings.announcement_enabled}
            initialTextNl={settings.announcement_text_nl ?? ""}
            initialTextEn={settings.announcement_text_en ?? ""}
          />

          <aside className="bg-sand/30 border border-border/40 p-5 text-sm text-muted leading-relaxed">
            <p className="text-deep-brown font-medium mb-2">Tips</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Houd het kort — een halve regel. De balk scrollt; te lange
                tekst leest niemand.
              </li>
              <li>
                Goede onderwerpen: actiecode, openingstijden afwijking, nieuwe
                behandeling, vakantie sluiting.
              </li>
              <li>
                Voorbeelden:{" "}
                <code className="bg-cream px-1.5 py-0.5">
                  Gratis verzending vanaf €50
                </code>{" "}
                ·{" "}
                <code className="bg-cream px-1.5 py-0.5">
                  Gebruik code ZOMER15 voor 15% korting
                </code>
              </li>
              <li>
                NL en EN versies allebei invullen, anders is de balk leeg voor
                de andere taal.
              </li>
              <li>
                Animatie pauzeert wanneer een bezoeker met de muis over de
                balk gaat.
              </li>
            </ul>
          </aside>
        </div>
      </AdminPage>
    </AdminShell>
  );
}

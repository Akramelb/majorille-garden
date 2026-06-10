import { redirect } from "next/navigation";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSiteSettings } from "@/lib/site-settings";
import { HeroImageRow } from "./HeroImageRow";

export const dynamic = "force-dynamic";

/**
 * Hero image manager. Parents can replace any of the three big hero shots
 * without touching the repo — uploads land in the `site-images` Supabase
 * Storage bucket, the override URL is stored on the `site_settings` row.
 * Consumers (home, about, JSON-LD) read via `getHeroImageUrl(slot)` which
 * falls back to the static `/public/images/...` path if nothing was set.
 */
export default async function AdminImagesPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const settings = await getSiteSettings();

  const slots = [
    {
      slot: "home" as const,
      label: "Home — grote hero",
      hint: "Bovenste foto op de homepage. Liefst landschap, minstens 1600px breed.",
      fallback: "/images/home/hero.jpg",
      currentUrl: settings.hero_home_url,
    },
    {
      slot: "promo" as const,
      label: "Home — promo blok",
      hint: "Tweede foto onder de hero. Mag iets kleiner zijn (1600×900 ofzo).",
      fallback: "/images/home/hero-promo.jpg",
      currentUrl: settings.hero_promo_url,
    },
    {
      slot: "about" as const,
      label: "Over ons — sfeerfoto",
      hint: "Verticale foto van het interieur op de Over ons pagina.",
      fallback: "/images/about/hero-blurred.jpg",
      currentUrl: settings.hero_about_url,
    },
  ];

  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Foto&rsquo;s"
        description="Vervang de drie hoofdfoto&rsquo;s van de site. Wijzigingen zijn na een paar seconden zichtbaar — geen redeploy nodig."
      >
        <div className="max-w-3xl space-y-8">
          {slots.map((s) => (
            <HeroImageRow
              key={s.slot}
              slot={s.slot}
              label={s.label}
              hint={s.hint}
              fallbackSrc={s.fallback}
              currentUrl={s.currentUrl}
            />
          ))}

          <div className="bg-sand/30 border border-border/40 p-5 text-sm text-muted leading-relaxed">
            <p className="text-deep-brown font-medium mb-2">Tips voor goede foto&rsquo;s</p>
            <ul className="list-disc list-inside space-y-1">
              <li>JPG, PNG of WebP — max 10 MB per foto.</li>
              <li>Hoog contrast, warme tinten passen het beste bij het site-design.</li>
              <li>
                Liever te groot dan te klein — de browser schaalt automatisch
                naar het juiste formaat per scherm.
              </li>
              <li>
                &ldquo;Terugzetten naar standaard&rdquo; gooit jouw foto weg en
                toont weer de originele foto die met de site meegeleverd is.
              </li>
            </ul>
          </div>
        </div>
      </AdminPage>
    </AdminShell>
  );
}

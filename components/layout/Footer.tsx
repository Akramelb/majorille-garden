import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

// Inline Instagram glyph — lucide-react stripped brand icons in v0.300+, so we
// ship the SVG ourselves. Sized at 14×14 to match the lucide icons next to it.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
import { SITE, localized } from "@/lib/content";
import type { Locale, Dictionary } from "@/app/[lang]/dictionaries";
import { NewsletterForm } from "../sections/NewsletterForm";

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.footer;
  const navT = dict.nav;
  const base = `/${locale}`;
  return (
    <footer className="mt-32 bg-deep-brown text-cream/80 riad-trellis-dark dusk-glow">
      <div className="brand-hairline" aria-hidden="true" />
      <div className="mx-auto w-full max-w-7xl container-px py-20 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="serif text-3xl text-cream tracking-tight leading-none">
            Majorille
          </div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-terracotta mt-1">
            Garden
          </div>
          <p className="mt-6 text-sm text-cream/65 max-w-xs">{t.tagline}</p>

          <div className="mt-8">
            <NewsletterForm dict={dict.newsletter} variant="dark" />
          </div>
        </div>

        <div>
          <h3 className="text-cream text-sm uppercase tracking-[0.18em] mb-5">
            {t.explore}
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href={base} className="hover:text-terracotta transition">
                {navT.home}
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/about`}
                className="hover:text-terracotta transition"
              >
                {navT.about}
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/services`}
                className="hover:text-terracotta transition"
              >
                {navT.services}
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/shop`}
                className="hover:text-terracotta transition"
              >
                {navT.shop}
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/booking`}
                className="hover:text-terracotta transition"
              >
                {navT.booking}
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/journal`}
                className="hover:text-terracotta transition"
              >
                Journal
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/reviews`}
                className="hover:text-terracotta transition"
              >
                Reviews
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/contact`}
                className="hover:text-terracotta transition"
              >
                {navT.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-cream text-sm uppercase tracking-[0.18em] mb-5">
            {t.address}
          </h3>
          <address className="not-italic space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-1 text-terracotta shrink-0" />
              <div>
                {SITE.address.street}
                <br />
                {SITE.address.postalCity}
                <br />
                {localized(SITE.address.country, locale)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-terracotta shrink-0" />
              <a
                href={SITE.phoneLink}
                className="hover:text-terracotta transition"
              >
                {SITE.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-terracotta shrink-0" />
              <a
                href={`mailto:${SITE.email}`}
                className="hover:text-terracotta transition"
              >
                {SITE.email}
              </a>
            </div>
            {SITE.socials.instagram && (
              <div className="flex items-center gap-2">
                <InstagramIcon className="text-terracotta shrink-0" />
                <a
                  href={SITE.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-terracotta transition"
                >
                  @majorillegarden
                </a>
              </div>
            )}
            <div className="text-xs text-cream/70 pt-2">
              KVK: {SITE.kvk} · BTW: {SITE.btw ?? "—"}
            </div>
          </address>
        </div>

        <div>
          <h3 className="text-cream text-sm uppercase tracking-[0.18em] mb-5">
            {t.hours}
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Clock size={14} className="mt-1 text-terracotta shrink-0" />
              <div>
                <div className="text-cream">
                  {localized(SITE.hours.women.label, locale)}
                </div>
                <div className="text-cream/65">
                  {localized(SITE.hours.women.range, locale)}
                </div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={14} className="mt-1 text-terracotta shrink-0" />
              <div>
                <div className="text-cream">
                  {localized(SITE.hours.men.label, locale)}
                </div>
                <div className="text-cream/65">
                  {localized(SITE.hours.men.range, locale)}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto w-full max-w-7xl container-px py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/70">
          <p>{t.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
          <div className="flex items-center gap-5">
            <Link
              href={`${base}/privacy`}
              className="hover:text-cream transition"
            >
              {locale === "nl" ? "Privacy" : "Privacy"}
            </Link>
            <Link
              href={`${base}/terms`}
              className="hover:text-cream transition"
            >
              {locale === "nl" ? "Voorwaarden" : "Terms"}
            </Link>
            <span className="uppercase tracking-[0.18em]">
              Amsterdam · Marrakech
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

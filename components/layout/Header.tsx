"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/app/[lang]/dictionaries";
import { LangSwitch } from "./LangSwitch";

type NavStrings = {
  home: string;
  about: string;
  services: string;
  booking: string;
  shop: string;
  contact: string;
  bookNow: string;
};

export function Header({ locale, nav }: { locale: Locale; nav: NavStrings }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);

  const base = `/${locale}`;
  const links = [
    { href: `${base}`, label: nav.home },
    { href: `${base}/about`, label: nav.about },
    { href: `${base}/services`, label: nav.services },
    { href: `${base}/shop`, label: nav.shop },
    { href: `${base}/contact`, label: nav.contact },
  ];

  const isHome = pathname === base || pathname === `${base}/`;
  // Transparent overlay only on home, only before scroll, and only when mobile menu is closed
  const overHero = isHome && !scrolled && !open;

  return (
    <header
      className={clsx(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-500",
        overHero
          ? "bg-transparent"
          : "bg-cream/95 backdrop-blur-sm border-b border-border/50",
      )}
    >
      <div className="mx-auto w-full max-w-7xl container-px flex items-center justify-between py-5 lg:py-6">
        <Link
          href={base}
          className="flex items-center gap-2.5 leading-none"
          aria-label="Majorille Garden — home"
        >
          <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" aria-hidden="true">
            <path
              d="M24 41 A22 22 0 0 1 10 10 A22 22 0 0 1 24 41 Z"
              fill={overHero ? "#FAF5EC" : "#63622f"}
            />
            <path
              d="M24 41 A22 22 0 0 0 38 10 A22 22 0 0 0 24 41 Z"
              fill={overHero ? "#E8DCC4" : "#7a7a45"}
            />
            <path
              d="M24 41 L11.5 12 M24 41 L36.5 12"
              fill="none"
              stroke={overHero ? "#7a7a45" : "#d8d8a8"}
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
          <span className="flex flex-col">
            <span
              className={clsx(
                "serif text-[1.65rem] tracking-tight transition-colors",
                overHero ? "text-cream" : "text-deep-brown",
              )}
            >
              Majorille
            </span>
            <span
              className={clsx(
                "text-[10px] uppercase tracking-[0.42em] mt-1 transition-colors",
                overHero ? "text-cream/85" : "text-terracotta",
              )}
            >
              Garden
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== base && pathname?.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "text-[0.72rem] uppercase tracking-[0.22em] transition-colors",
                  overHero
                    ? active
                      ? "text-cream"
                      : "text-cream/75 hover:text-cream"
                    : active
                      ? "text-deep-brown"
                      : "text-deep-brown/70 hover:text-terracotta",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-7">
          <LangSwitch locale={locale} />
          <Link
            href={`${base}/booking`}
            className={clsx(
              "link-edit",
              overHero && "link-edit--light",
            )}
          >
            {nav.bookNow}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className={clsx(
            "lg:hidden p-2 transition-colors",
            overHero ? "text-cream" : "text-deep-brown",
          )}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-cream">
          <div className="mx-auto w-full max-w-7xl container-px py-6 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className="py-3 text-sm uppercase tracking-[0.22em] text-deep-brown border-b border-border/40"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between mt-6">
              <LangSwitch locale={locale} />
              <Link
                href={`${base}/booking`}
                onClick={closeMenu}
                className="link-edit"
              >
                {nav.bookNow}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

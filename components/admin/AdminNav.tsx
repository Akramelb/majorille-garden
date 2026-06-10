"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Star,
  BookOpen,
  HelpCircle,
  ShoppingBag,
  Activity,
  ExternalLink,
  ImageIcon,
  Tag,
  Megaphone,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/workspace", label: "Workspace", icon: Activity },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/blog", label: "Journal", icon: BookOpen },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/images", label: "Foto's", icon: ImageIcon },
  { href: "/admin/promos", label: "Codes", icon: Tag },
  { href: "/admin/banner", label: "Bovenbalk", icon: Megaphone },
];

export function AdminNav({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the drawer whenever the route changes (derived during render
  // to satisfy react-hooks/set-state-in-effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  const navList = (
    <nav aria-label="Admin navigatie" className="flex flex-col gap-1 text-sm">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-sm transition-colors",
              active
                ? "bg-deep-brown text-cream"
                : "text-deep-brown/75 hover:bg-sand/50 hover:text-deep-brown",
            )}
          >
            <Icon size={16} className={active ? "text-terracotta" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footerBlock = (
    <div className="border-t border-border/50 pt-5 mt-6 space-y-2 text-xs">
      {userEmail && (
        <p className="px-4 text-muted truncate" title={userEmail}>
          {userEmail}
        </p>
      )}
      <a
        href="/nl"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2 text-muted hover:text-deep-brown"
      >
        <ExternalLink size={12} /> Live site
      </a>
      <button
        type="button"
        onClick={signOut}
        className="w-full text-left px-4 py-2 text-muted hover:text-terracotta"
      >
        Uitloggen
      </button>
    </div>
  );

  const brandBlock = (
    <Link
      href="/admin"
      className="flex items-baseline gap-2 px-4 pb-7 border-b border-border/50"
    >
      <span className="serif text-2xl text-deep-brown leading-none">
        Majorille
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-terracotta">
        Admin
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-cream lg:border-r lg:border-border/60 lg:py-7 lg:overflow-y-auto">
        {brandBlock}
        <div className="px-3 pt-6 flex-1">{navList}</div>
        <div className="px-3">{footerBlock}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-border/60">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="serif text-xl text-deep-brown leading-none">
              Majorille
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-terracotta">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menu openen"
            aria-expanded={open}
            aria-controls="admin-drawer"
            className="p-2 text-deep-brown"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div id="admin-drawer" className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menu sluiten (achtergrond)"
            tabIndex={-1}
            className="absolute inset-0 bg-deep-brown/30"
          />
          <aside className="relative ml-auto w-72 max-w-[85%] h-full bg-cream py-7 flex flex-col shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Menu sluiten"
              className="absolute top-5 right-5 p-2 text-deep-brown"
            >
              <X size={18} aria-hidden="true" />
            </button>
            {brandBlock}
            <div className="px-3 pt-6 flex-1">{navList}</div>
            <div className="px-3">{footerBlock}</div>
          </aside>
        </div>
      )}
    </>
  );
}

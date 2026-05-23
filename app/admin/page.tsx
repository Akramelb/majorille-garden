import { redirect } from "next/navigation";
import { Mail, Inbox, Users, ExternalLink } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

type ContactRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
};
type SubRow = { id: string; created_at: string; email: string };

export default async function AdminHome() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  let contacts: ContactRow[] = [];
  let subs: SubRow[] = [];
  let dbError: string | null = null;

  if (hasSupabaseConfig()) {
    const sb = getSupabaseServiceClient();
    const [c, s] = await Promise.all([
      sb
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      sb
        .from("newsletter_subscribers")
        .select("id,created_at,email")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (c.error || s.error) dbError = c.error?.message ?? s.error?.message ?? null;
    contacts = (c.data as ContactRow[]) ?? [];
    subs = (s.data as SubRow[]) ?? [];
  } else {
    dbError = "Supabase service env not configured.";
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-cream/95 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <span className="serif text-2xl text-deep-brown">Majorille</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-terracotta ml-2">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted hidden sm:inline">{user.email}</span>
            <a
              href="/admin/blog"
              className="text-muted hover:text-deep-brown"
            >
              Journal
            </a>
            <a
              href="/admin/reviews"
              className="text-muted hover:text-deep-brown"
            >
              Reviews
            </a>
            <a
              href="/admin/faq"
              className="text-muted hover:text-deep-brown"
            >
              FAQ
            </a>
            <a
              href="/nl"
              className="text-muted hover:text-deep-brown inline-flex items-center gap-1"
            >
              Site <ExternalLink size={12} />
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Stat icon={<Inbox size={18} />} label="Berichten" value={contacts.length} />
          <Stat
            icon={<Mail size={18} />}
            label="Ongelezen"
            value={contacts.filter((c) => !c.read).length}
          />
          <Stat icon={<Users size={18} />} label="Nieuwsbrief" value={subs.length} />
        </div>

        {dbError && (
          <div className="mb-8 px-4 py-3 bg-terracotta/10 border-l-2 border-terracotta text-sm text-deep-brown">
            {dbError}
          </div>
        )}

        {/* Contact submissions */}
        <section className="mb-12">
          <h2 className="serif text-2xl text-deep-brown mb-4">Contactberichten</h2>
          {contacts.length === 0 ? (
            <p className="text-muted text-sm">Nog geen berichten.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-cream border border-border/50 p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p className="text-deep-brown font-medium">
                      {c.name}{" "}
                      <a
                        href={`mailto:${c.email}`}
                        className="text-terracotta text-sm font-normal hover:underline"
                      >
                        {c.email}
                      </a>
                      {c.phone && (
                        <span className="text-muted text-sm font-normal">
                          {" "}
                          · {c.phone}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-muted">{fmt(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
                    {c.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter */}
        <section>
          <h2 className="serif text-2xl text-deep-brown mb-4">
            Nieuwsbrief-inschrijvingen
          </h2>
          {subs.length === 0 ? (
            <p className="text-muted text-sm">Nog geen inschrijvingen.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subs.map((s) => (
                <span
                  key={s.id}
                  className="text-xs bg-sand/40 border border-border/40 px-3 py-1.5 text-deep-brown"
                  title={fmt(s.created_at)}
                >
                  {s.email}
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-cream border border-border/50 p-5 flex items-center gap-4">
      <span className="w-10 h-10 flex items-center justify-center bg-terracotta/15 text-terracotta shrink-0">
        {icon}
      </span>
      <div>
        <p className="serif text-3xl text-deep-brown leading-none">{value}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

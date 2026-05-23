import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getAllFAQs } from "@/lib/faqs";
import { FAQRowControls } from "./FAQRowControls";

export const dynamic = "force-dynamic";

export default async function AdminFAQ() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const faqs = await getAllFAQs();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-cream/95 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-deep-brown"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <Link
            href="/admin/faq/new"
            className="inline-flex items-center gap-2 text-sm bg-deep-brown text-cream px-4 py-2 hover:bg-terracotta transition-colors"
          >
            <Plus size={14} /> Nieuwe FAQ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="serif text-3xl text-deep-brown mb-2">Veelgestelde vragen</h1>
        <p className="text-sm text-muted mb-8">
          Zichtbaar op de homepagina. Sleep-loos sorteren via de pijlen.
        </p>

        {faqs.length === 0 ? (
          <p className="text-muted text-sm">
            Nog geen FAQs. Voeg de eerste toe.
          </p>
        ) : (
          <div className="divide-y divide-border/50 border-y border-border/50">
            {faqs.map((f, i) => (
              <div key={f.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-deep-brown font-medium">
                      {f.question_nl}
                    </span>
                    {!f.active && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-sand/60 text-muted">
                        Verborgen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {f.answer_nl}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/admin/faq/${f.id}`}
                    className="inline-flex items-center gap-1 text-xs text-deep-brown hover:text-terracotta"
                  >
                    <Pencil size={13} /> Bewerken
                  </Link>
                  <FAQRowControls
                    id={f.id}
                    question={f.question_nl}
                    canMoveUp={i > 0}
                    canMoveDown={i < faqs.length - 1}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

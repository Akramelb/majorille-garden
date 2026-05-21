import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, Pencil, ExternalLink } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getAllPosts } from "@/lib/blog";
import { DeletePostButton } from "./DeletePostButton";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const posts = await getAllPosts();

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
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 text-sm bg-deep-brown text-cream px-4 py-2 hover:bg-terracotta transition-colors"
          >
            <Plus size={14} /> Nieuw artikel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="serif text-3xl text-deep-brown mb-6">Journal</h1>
        {posts.length === 0 ? (
          <p className="text-muted text-sm">
            Nog geen artikelen. Maak het eerste aan.
          </p>
        ) : (
          <div className="divide-y divide-border/50 border-y border-border/50">
            {posts.map((p) => (
              <div
                key={p.id}
                className="py-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-deep-brown font-medium">
                      {p.title_nl}
                    </span>
                    <span
                      className={
                        p.published
                          ? "text-[10px] uppercase tracking-wider px-2 py-0.5 bg-olive/15 text-olive"
                          : "text-[10px] uppercase tracking-wider px-2 py-0.5 bg-sand/60 text-muted"
                      }
                    >
                      {p.published ? "Gepubliceerd" : "Concept"}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">/{p.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  {p.published && (
                    <a
                      href={`/nl/journal/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-deep-brown"
                    >
                      Bekijk <ExternalLink size={12} />
                    </a>
                  )}
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs text-deep-brown hover:text-terracotta"
                  >
                    <Pencil size={13} /> Bewerken
                  </Link>
                  <DeletePostButton id={p.id} title={p.title_nl} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

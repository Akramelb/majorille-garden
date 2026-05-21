import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getReviewsByStatus, type Review } from "@/lib/reviews";
import { getServiceBySlug } from "@/lib/content";
import { StarRating } from "@/components/sections/StarRating";
import { ModerationControls } from "./ModerationControls";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const [pending, approved, rejected] = await Promise.all([
    getReviewsByStatus("pending"),
    getReviewsByStatus("approved"),
    getReviewsByStatus("rejected"),
  ]);

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
          <span className="serif text-xl text-deep-brown">Reviews</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-12">
        <Group title={`In afwachting (${pending.length})`} reviews={pending} />
        <Group title={`Goedgekeurd (${approved.length})`} reviews={approved} />
        <Group title={`Afgewezen (${rejected.length})`} reviews={rejected} />
      </main>
    </div>
  );
}

function Group({ title, reviews }: { title: string; reviews: Review[] }) {
  return (
    <section>
      <h2 className="serif text-2xl text-deep-brown mb-4">{title}</h2>
      {reviews.length === 0 ? (
        <p className="text-muted text-sm">Geen.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const svc = r.service_slug ? getServiceBySlug(r.service_slug) : null;
            return (
              <div key={r.id} className="bg-cream border border-border/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <StarRating rating={r.rating} />
                    <span className="text-deep-brown font-medium text-sm">
                      {r.author_name}
                    </span>
                    {svc && (
                      <span className="text-xs uppercase tracking-[0.14em] text-terracotta">
                        {svc.name.nl}
                      </span>
                    )}
                  </div>
                  <ModerationControls id={r.id} status={r.status} />
                </div>
                <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
                  {r.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

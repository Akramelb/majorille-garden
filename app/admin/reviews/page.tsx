import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getReviewsByStatus, type Review } from "@/lib/reviews";
import { getServiceBySlug } from "@/lib/content";
import { StarRating } from "@/components/sections/StarRating";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
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
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage
        title="Reviews"
        description="Goedkeuren of afwijzen. Goedgekeurde reviews verschijnen direct op de site."
      >
        <div className="space-y-12">
          <Group title={`In afwachting (${pending.length})`} reviews={pending} />
          <Group title={`Goedgekeurd (${approved.length})`} reviews={approved} />
          <Group title={`Afgewezen (${rejected.length})`} reviews={rejected} />
        </div>
      </AdminPage>
    </AdminShell>
  );
}

function Group({ title, reviews }: { title: string; reviews: Review[] }) {
  return (
    <section>
      <h2 className="serif text-2xl text-deep-brown mb-4">{title}</h2>
      {reviews.length === 0 ? (
        <p className="text-muted text-sm py-4 px-5 bg-sand/30 border border-border/30 rounded-sm">
          Geen.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const svc = r.service_slug ? getServiceBySlug(r.service_slug) : null;
            return (
              <article
                key={r.id}
                className="bg-cream border border-border/50 rounded-sm p-5"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 mb-2">
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
                </header>
                <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
                  {r.body}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

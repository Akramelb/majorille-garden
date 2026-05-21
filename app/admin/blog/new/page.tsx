import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-cream/95">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-deep-brown"
          >
            <ArrowLeft size={14} /> Journal
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="serif text-3xl text-deep-brown mb-8">Nieuw artikel</h1>
        <PostEditor />
      </main>
    </div>
  );
}

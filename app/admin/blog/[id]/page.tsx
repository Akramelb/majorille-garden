import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getPostById } from "@/lib/blog";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPost(props: PageProps<"/admin/blog/[id]">) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const { id } = await props.params;
  const post = await getPostById(id);
  if (!post) notFound();
  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage title="Artikel bewerken" description={`/${post.slug}`}>
        <PostEditor post={post} />
      </AdminPage>
    </AdminShell>
  );
}

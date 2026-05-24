import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage title="Nieuw artikel">
        <PostEditor />
      </AdminPage>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { FAQEditor } from "../FAQEditor";

export const dynamic = "force-dynamic";

export default async function NewFAQ() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage title="Nieuwe FAQ">
        <FAQEditor />
      </AdminPage>
    </AdminShell>
  );
}

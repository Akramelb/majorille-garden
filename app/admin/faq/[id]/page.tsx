import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { getFAQById } from "@/lib/faqs";
import { AdminShell, AdminPage } from "@/components/admin/AdminShell";
import { FAQEditor } from "../FAQEditor";

export const dynamic = "force-dynamic";

export default async function EditFAQ(props: PageProps<"/admin/faq/[id]">) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const { id } = await props.params;
  const faq = await getFAQById(id);
  if (!faq) notFound();
  return (
    <AdminShell userEmail={user.email ?? null}>
      <AdminPage title="FAQ bewerken">
        <FAQEditor faq={faq} />
      </AdminPage>
    </AdminShell>
  );
}

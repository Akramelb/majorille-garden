import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";

// Phase 2 placeholder. Once Supabase auth is wired:
//   1. Check `await supabase.auth.getUser()` here
//   2. If no user, redirect to /admin/login
//   3. Show the actual CMS UI (services, FAQ, gallery, submissions, subscribers)

export default function AdminHome() {
  // Force unauthenticated state in Phase 1 — no auth set up yet
  redirect("/admin/login");
}

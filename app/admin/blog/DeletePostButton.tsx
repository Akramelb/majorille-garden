"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/admin-actions";

export function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Verwijder "${title}"? Dit kan niet ongedaan worden.`)) {
          start(() => void deletePost(id));
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-terracotta disabled:opacity-50"
    >
      <Trash2 size={13} /> Verwijderen
    </button>
  );
}

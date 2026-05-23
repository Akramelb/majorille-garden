"use client";

import { useTransition } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { deleteFAQ, moveFAQ } from "@/lib/admin-actions";

export function FAQRowControls({
  id,
  question,
  canMoveUp,
  canMoveDown,
}: {
  id: string;
  question: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending || !canMoveUp}
        onClick={() => start(() => void moveFAQ(id, -1))}
        title="Omhoog"
        className="p-1.5 text-muted hover:text-deep-brown disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        disabled={pending || !canMoveDown}
        onClick={() => start(() => void moveFAQ(id, 1))}
        title="Omlaag"
        className="p-1.5 text-muted hover:text-deep-brown disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronDown size={16} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Verwijder "${question}"?`)) {
            start(() => void deleteFAQ(id));
          }
        }}
        title="Verwijderen"
        className="p-1.5 text-muted hover:text-terracotta disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

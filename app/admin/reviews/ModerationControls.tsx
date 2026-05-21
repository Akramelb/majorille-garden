"use client";

import { useTransition } from "react";
import { Check, X, Undo2 } from "lucide-react";
import { setReviewStatus } from "@/lib/admin-actions";
import type { ReviewStatus } from "@/lib/reviews";

export function ModerationControls({
  id,
  status,
}: {
  id: string;
  status: ReviewStatus;
}) {
  const [pending, start] = useTransition();
  const act = (next: ReviewStatus) => start(() => void setReviewStatus(id, next));
  return (
    <div className="flex items-center gap-2">
      {status !== "approved" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("approved")}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-olive text-cream hover:opacity-90 disabled:opacity-50"
        >
          <Check size={13} /> Goedkeuren
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("rejected")}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-border text-deep-brown hover:bg-sand/40 disabled:opacity-50"
        >
          <X size={13} /> Afwijzen
        </button>
      )}
      {status !== "pending" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("pending")}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 text-muted hover:text-deep-brown disabled:opacity-50"
        >
          <Undo2 size={13} /> Wachtrij
        </button>
      )}
    </div>
  );
}

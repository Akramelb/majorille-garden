"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { refundOrderAction } from "./actions";

/**
 * Refund button + inline error display. Rendered for both bookings and products
 * once they're `paid`. Mirrors the ModerationControls pattern from
 * app/admin/reviews/ModerationControls.tsx.
 */
export function RefundButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (
      !window.confirm("Weet je zeker dat je deze betaling wilt terugbetalen?")
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const result = await refundOrderAction(orderId);
      if (!result.ok) {
        setError(result.message ?? "internal-error");
      }
    });
  };

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="inline-flex items-center justify-center gap-1 text-xs px-3 py-2 sm:py-1.5 border border-border text-deep-brown hover:bg-sand/40 disabled:opacity-50 w-full sm:w-auto"
      >
        <Undo2 size={13} /> {pending ? "Bezig…" : "Terugbetalen"}
      </button>
      {error && (
        <span className="text-[11px] text-terracotta">
          Mislukt: {error}
        </span>
      )}
    </div>
  );
}

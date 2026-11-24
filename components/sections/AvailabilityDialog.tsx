"use client";

import { useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import type { Audience } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";
import { AvailabilityCalendar } from "@/components/sections/AvailabilityCalendar";

const SCROLL_LOCK = "overflow-hidden";

/**
 * Trigger + native modal dialog around the read-only availability calendar.
 * The calendar mounts only while open, so it fetches lazily. All buttons are
 * type="button": the dialog lives inside the booking <form>.
 */
export function AvailabilityDialog({
  serviceSlug,
  audience,
  locale,
  onContinue,
}: {
  serviceSlug: string;
  audience: Audience;
  locale: Locale;
  onContinue: () => void;
}) {
  const nl = locale === "nl";
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    ref.current?.showModal();
    document.documentElement.classList.add(SCROLL_LOCK);
    setOpen(true);
  }

  function close() {
    ref.current?.close();
  }

  // Fires for every close path: button, Esc, backdrop.
  function handleClose() {
    document.documentElement.classList.remove(SCROLL_LOCK);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex items-center gap-2 border border-deep-brown px-4 py-2 text-sm text-deep-brown hover:bg-deep-brown hover:text-cream transition-colors"
      >
        <CalendarDays size={16} aria-hidden="true" />
        {nl ? "Bekijk vrije dagen" : "See free days"}
      </button>

      <dialog
        ref={ref}
        onClose={handleClose}
        onClick={(e) => {
          // Clicks on the dialog element itself (not its children) hit the backdrop.
          if (e.target === e.currentTarget) close();
        }}
        aria-labelledby="availability-dialog-title"
        className="m-0 mt-auto w-full max-w-none max-h-[90dvh] overflow-y-auto bg-cream p-0 text-deep-brown backdrop:bg-deep-brown/60 sm:m-auto sm:max-w-[32rem]"
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="availability-dialog-title"
              className="serif text-xl text-deep-brown"
            >
              {nl ? "Vrije dagen" : "Free days"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={nl ? "Sluiten" : "Close"}
              className="p-2 text-deep-brown hover:bg-sand/30"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <p className="border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-deep-brown">
            {nl
              ? "Alleen ter info. Je kiest je tijd direct na de betaling."
              : "For reference only. You pick your time right after payment."}
          </p>

          {open && (
            <AvailabilityCalendar
              serviceSlug={serviceSlug}
              audience={audience}
              locale={locale}
            />
          )}

          <button
            type="button"
            onClick={() => {
              close();
              onContinue();
            }}
            className="btn-primary w-full"
          >
            {nl
              ? "Sluiten en verder naar betalen"
              : "Close and continue to payment"}
          </button>
        </div>
      </dialog>
    </>
  );
}

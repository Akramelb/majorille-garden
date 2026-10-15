"use client";

import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { FAQ } from "@/lib/content";
import { localized } from "@/lib/content";
import type { Locale } from "@/app/[lang]/dictionaries";

export function FAQAccordion({
  faqs,
  locale,
}: {
  faqs: FAQ[];
  locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(0);
  // Stable across SSR + hydration, so aria-controls/aria-labelledby always
  // point at the ids that actually render.
  const baseId = useId();
  return (
    <div className="divide-y divide-border/60 border-y border-border/60">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={i}>
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-6 text-left group"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="serif text-xl lg:text-2xl text-deep-brown leading-snug">
                {localized(faq.question, locale)}
              </span>
              <span
                className={clsx(
                  "shrink-0 w-9 h-9 flex items-center justify-center border border-deep-brown/30 transition-colors",
                  isOpen
                    ? "bg-deep-brown text-cream"
                    : "text-deep-brown group-hover:bg-deep-brown group-hover:text-cream",
                )}
              >
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {/* `grid-rows-[0fr]` only collapses the box — the answer stays in
                the a11y tree and screen readers read every one. `visibility`
                takes it out properly; it animates discretely, so it flips to
                hidden only once the collapse finishes and the motion is kept. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={clsx(
                "grid transition-[grid-template-rows,visibility] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] visible" : "grid-rows-[0fr] invisible",
              )}
            >
              <div className="overflow-hidden">
                <p className="text-muted leading-relaxed pb-6 pr-12 max-w-3xl">
                  {localized(faq.answer, locale)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Prev/next controls for a CSS scroll-snap rail (e.g. the homepage Rituals
 * rail). Kept deliberately decoupled from the rail markup: it finds the rail by
 * `targetId` and drives it with `scrollBy`, so the cards stay server-rendered.
 * Buttons disable at the scroll extremes and the whole group hides when there's
 * nothing to scroll. Themed like `btn-secondary` — deep-brown keyline that
 * fills on hover.
 */
export function RailControls({
  targetId,
  prevLabel,
  nextLabel,
}: {
  targetId: string;
  prevLabel: string;
  nextLabel: string;
}) {
  // Default to "overflowing, at the start" — the common case on load is a full
  // rail scrolled to 0, so the controls render immediately without a flash.
  const [overflows, setOverflows] = useState(true);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setOverflows(scrollWidth - clientWidth > 4);
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, [targetId]);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    // Measure after the first paint (not synchronously in the effect body), so
    // the rail has its real laid-out width.
    const raf = requestAnimationFrame(sync);
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [targetId, sync]);

  const scrollRail = (dir: 1 | -1) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    // One card-width per click; fall back to ~80% of the viewport if empty.
    const amount = card ? card.offsetWidth + 28 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const btn =
    "grid h-12 w-12 place-items-center rounded-full border border-deep-brown/25 text-deep-brown " +
    "transition-all duration-300 hover:border-deep-brown hover:bg-deep-brown hover:text-cream " +
    "disabled:opacity-25 disabled:pointer-events-none";

  return (
    <div
      role="group"
      aria-label={`${prevLabel} / ${nextLabel}`}
      className={`${overflows ? "flex" : "hidden"} items-center gap-3`}
    >
      <button
        type="button"
        aria-label={prevLabel}
        onClick={() => scrollRail(-1)}
        disabled={atStart}
        className={btn}
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        onClick={() => scrollRail(1)}
        disabled={atEnd}
        className={btn}
      >
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

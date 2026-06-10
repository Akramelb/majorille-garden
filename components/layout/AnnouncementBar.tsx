import { Phone, Mail } from "lucide-react";
import { SITE } from "@/lib/content";

/**
 * Scrolling announcement bar shown above the header. Three slots — phone
 * (left feel), admin-editable text (center feel), email (right feel) —
 * concatenated into a single marquee loop. We render the segment list
 * TWICE inside an `animate-marquee` flex wrapper so the keyframe can
 * `translateX(-50%)` for a perfectly seamless cycle.
 *
 * Server component — pulls SITE constants and accepts the resolved
 * announcement text as a prop so the layout owns the Supabase round-trip.
 * Conditional render: when `text` is null/empty the layout shouldn't
 * mount this at all (CSS `--bar-h` stays at 0 → Header sits flush at the
 * viewport top exactly as before the feature existed).
 */
export function AnnouncementBar({
  text,
  lang,
}: {
  text: string;
  lang: "nl" | "en";
}) {
  const segments = (
    <>
      <a
        href={SITE.phoneLink}
        className="inline-flex items-center gap-2 px-6 hover:text-terracotta transition-colors"
      >
        <Phone size={12} className="shrink-0" aria-hidden="true" />
        <span>{SITE.phone}</span>
      </a>
      <span className="px-2 text-cream/40" aria-hidden="true">
        ◆
      </span>
      <span className="px-6 uppercase tracking-[0.18em] text-cream">
        {text}
      </span>
      <span className="px-2 text-cream/40" aria-hidden="true">
        ◆
      </span>
      <a
        href={`mailto:${SITE.email}`}
        className="inline-flex items-center gap-2 px-6 hover:text-terracotta transition-colors"
      >
        <Mail size={12} className="shrink-0" aria-hidden="true" />
        <span>{SITE.email}</span>
      </a>
      <span className="px-2 text-cream/40" aria-hidden="true">
        ◆
      </span>
    </>
  );

  return (
    <div
      role="region"
      aria-label={lang === "nl" ? "Aankondiging" : "Announcement"}
      className="fixed top-0 inset-x-0 z-[60] h-9 bg-deep-brown text-cream/90 text-xs flex items-center overflow-hidden"
    >
      <div className="animate-marquee flex whitespace-nowrap will-change-transform">
        {/* First copy of the segments — what the user actually reads first. */}
        <div className="flex items-center shrink-0">{segments}</div>
        {/* Duplicate, hidden from assistive tech — exists only so the
            translateX(-50%) lands on identical content for a seamless loop. */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {segments}
        </div>
      </div>
    </div>
  );
}

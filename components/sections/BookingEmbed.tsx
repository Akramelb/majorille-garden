"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

type Props = {
  /** Already includes `<username>/<bookingSlug>-<audience>`. */
  calLink: string;
  prefillEmail: string | null;
  prefillName: string | null;
  lang: "nl" | "en";
};

/**
 * Cal.com embed wrapper, used by the booking return page once the order is
 * paid. The picker UI lives in BookingForm; this component only renders the
 * scheduler with the order details prefilled. Reconciliation between a
 * Cal.com booking and an `orders` row is done by `customer_email + service`
 * matching in /admin/orders — not by injecting the order UUID into notes.
 */
export function BookingEmbed({
  calLink,
  prefillEmail,
  prefillName,
  lang,
}: Props) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cal = await getCalApi();
      if (cancelled) return;
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#C4633A" },
          dark: { "cal-brand": "#C4633A" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-cream border border-border/60 min-h-[600px] md:min-h-[700px] overflow-hidden w-full max-w-full">
      <Cal
        key={calLink}
        calLink={calLink}
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "700px",
          overflow: "auto",
        }}
        config={{
          layout: "month_view",
          language: lang,
          ...(prefillName ? { name: prefillName } : {}),
          ...(prefillEmail ? { email: prefillEmail } : {}),
        }}
      />
    </div>
  );
}

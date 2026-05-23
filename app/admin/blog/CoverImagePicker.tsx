"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageGroup } from "@/lib/image-manifest";

export function CoverImagePicker({
  defaultValue,
  imageGroups,
}: {
  defaultValue: string;
  imageGroups: ImageGroup[];
}) {
  const [value, setValue] = useState(defaultValue);
  const isLocal = value.startsWith("/");

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
          Cover image
        </span>

        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <input
            name="cover_image"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/images/… of https://…"
            className="px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
          />
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setValue(e.target.value);
            }}
            className="px-3 py-3 bg-cream border border-border text-deep-brown text-sm"
            aria-label="Kies uit /public/images"
          >
            <option value="">Kies uit /public/images…</option>
            {imageGroups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.paths.map((p) => (
                  <option key={p} value={p}>
                    {p.split("/").slice(-1)[0]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </label>

      {value && (
        <div className="relative aspect-[3/2] w-full max-w-sm bg-sand/30 overflow-hidden border border-border/60">
          {isLocal ? (
            <Image
              src={value}
              alt="Cover preview"
              fill
              sizes="384px"
              className="object-cover"
              unoptimized={value.endsWith(".svg")}
            />
          ) : (
            // External URL — render as plain <img/> so we don't have to whitelist hosts
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}

import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Container({
  size = "lg",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: Size }) {
  return (
    <div
      {...props}
      className={clsx("mx-auto w-full container-px", SIZES[size], className)}
    />
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        // terracotta-dark (#A04E2A) hits 4.85:1 on cream — meets WCAG AA for
        // small text. Plain terracotta sat at 3.72:1 which is below threshold.
        "text-xs uppercase tracking-[0.22em] text-terracotta-dark font-medium",
        className,
      )}
    >
      {children}
    </p>
  );
}

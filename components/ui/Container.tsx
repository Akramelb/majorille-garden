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
        "text-xs uppercase tracking-[0.22em] text-terracotta font-medium",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ZelligeDivider({ className }: { className?: string }) {
  return <div className={clsx("zellige-divider", className)} aria-hidden />;
}

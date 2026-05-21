"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import { subscribeNewsletter, type FormState } from "@/lib/actions";

type Dict = {
  title: string;
  subtitle: string;
  placeholder: string;
  subscribe: string;
  success: string;
  error: string;
};

function SubmitButton({ label, variant }: { label: string; variant: "light" | "dark" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "px-5 py-3 text-xs uppercase tracking-[0.18em] font-medium transition-colors disabled:opacity-60",
        variant === "dark"
          ? "w-full bg-terracotta text-cream hover:bg-terracotta-dark"
          : "bg-deep-brown text-cream hover:bg-terracotta",
      )}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function NewsletterForm({
  dict,
  variant = "light",
}: {
  dict: Dict;
  variant?: "light" | "dark";
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    subscribeNewsletter,
    null,
  );

  return (
    <form
      action={formAction}
      className={clsx("w-full", variant === "light" && "max-w-sm")}
    >
      {variant === "light" && (
        <>
          <h3 className="serif text-2xl text-deep-brown mb-2">{dict.title}</h3>
          <p className="text-sm text-muted mb-4">{dict.subtitle}</p>
        </>
      )}
      {variant === "dark" && (
        <p className="text-xs uppercase tracking-[0.18em] text-cream mb-3">
          {dict.title}
        </p>
      )}
      <div className={clsx(variant === "dark" ? "flex flex-col gap-2" : "flex")}>
        <input
          type="email"
          name="email"
          required
          placeholder={dict.placeholder}
          aria-label={dict.placeholder}
          className={clsx(
            "min-w-0 flex-1 px-4 py-3 text-sm border outline-none focus:ring-1",
            variant === "dark"
              ? "w-full bg-deep-brown border-cream/20 text-cream placeholder:text-cream/40 focus:border-terracotta focus:ring-terracotta"
              : "bg-cream border-border text-deep-brown placeholder:text-muted/60 focus:border-deep-brown focus:ring-deep-brown",
          )}
        />
        <SubmitButton label={dict.subscribe} variant={variant} />
      </div>
      {state && (
        <p
          className={clsx(
            "mt-3 text-xs",
            state.ok
              ? variant === "dark"
                ? "text-cream/80"
                : "text-olive"
              : "text-terracotta",
          )}
        >
          {state.ok ? dict.success : dict.error}
        </p>
      )}
    </form>
  );
}

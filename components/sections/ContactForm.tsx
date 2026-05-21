"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact, type FormState } from "@/lib/actions";

type Dict = {
  name: string;
  email: string;
  phone: string;
  message: string;
  send: string;
  sending: string;
  success: string;
  error: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? busy : idle}
    </button>
  );
}

export function ContactForm({ dict }: { dict: Dict }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    submitContact,
    null,
  );
  return (
    <form action={formAction} className="space-y-5">
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] w-px h-px"
        aria-hidden
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={dict.name} name="name" required />
        <Field label={dict.email} name="email" type="email" required />
      </div>
      <Field label={dict.phone} name="phone" type="tel" />
      <Field label={dict.message} name="message" textarea required />

      <div className="flex items-center justify-between gap-4 pt-2">
        <SubmitButton idle={dict.send} busy={dict.sending} />
        {state && (
          <p
            className={state.ok ? "text-olive text-sm" : "text-terracotta text-sm"}
          >
            {state.ok ? dict.success : dict.error}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-2">
        {label}
        {required ? " *" : ""}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={5}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown resize-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      )}
    </label>
  );
}

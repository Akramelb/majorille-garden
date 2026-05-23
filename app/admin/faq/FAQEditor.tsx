import Link from "next/link";
import { createFAQ, updateFAQ } from "@/lib/admin-actions";
import type { FAQRow } from "@/lib/faqs";

export function FAQEditor({ faq }: { faq?: FAQRow }) {
  const editing = Boolean(faq);
  const action = editing ? updateFAQ : createFAQ;
  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {editing && <input type="hidden" name="id" value={faq!.id} />}

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Vraag (NL)" name="question_nl" defaultValue={faq?.question_nl} required />
        <Field label="Question (EN)" name="question_en" defaultValue={faq?.question_en} required />
        <Field label="Antwoord (NL)" name="answer_nl" defaultValue={faq?.answer_nl} textarea rows={5} required />
        <Field label="Answer (EN)" name="answer_en" defaultValue={faq?.answer_en} textarea rows={5} required />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={faq?.active ?? true}
          className="w-4 h-4 accent-[#4A5D3A]"
        />
        <span className="text-sm text-deep-brown">Actief (zichtbaar op de site)</span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" className="btn-primary">
          {editing ? "Opslaan" : "Aanmaken"}
        </button>
        <Link href="/admin/faq" className="text-sm text-muted hover:text-deep-brown">
          Annuleren
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  textarea,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
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
          defaultValue={defaultValue}
          required={required}
          rows={rows}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown resize-y"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      )}
    </label>
  );
}

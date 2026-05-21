import Link from "next/link";
import { createPost, updatePost } from "@/lib/admin-actions";
import type { BlogPost } from "@/lib/blog";

// Server component form. Posts to a Server Action (create or update).
export function PostEditor({ post }: { post?: BlogPost }) {
  const editing = Boolean(post);
  const action = editing ? updatePost : createPost;

  return (
    <form action={action} className="space-y-8 max-w-3xl">
      {editing && <input type="hidden" name="id" value={post!.id} />}

      <Field
        label="Slug (URL)"
        name="slug"
        defaultValue={post?.slug}
        placeholder="warme-zandtherapie-uitgelegd"
        required
      />
      <Field
        label="Cover image URL"
        name="cover_image"
        defaultValue={post?.cover_image ?? ""}
        placeholder="/images/services/warme-zandbad/hero.jpg"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Titel (NL)" name="title_nl" defaultValue={post?.title_nl} required />
        <Field label="Title (EN)" name="title_en" defaultValue={post?.title_en} required />
        <Field label="Samenvatting (NL)" name="excerpt_nl" defaultValue={post?.excerpt_nl ?? ""} textarea rows={2} />
        <Field label="Excerpt (EN)" name="excerpt_en" defaultValue={post?.excerpt_en ?? ""} textarea rows={2} />
        <Field label="Tekst (NL) — Markdown" name="body_nl" defaultValue={post?.body_nl} textarea rows={16} required />
        <Field label="Body (EN) — Markdown" name="body_en" defaultValue={post?.body_en} textarea rows={16} required />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? false}
          className="w-4 h-4 accent-[#4A5D3A]"
        />
        <span className="text-sm text-deep-brown">
          Gepubliceerd (zichtbaar op de site)
        </span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" className="btn-primary">
          {editing ? "Opslaan" : "Aanmaken"}
        </button>
        <Link href="/admin/blog" className="text-sm text-muted hover:text-deep-brown">
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
  placeholder,
  required,
  textarea,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
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
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown resize-y font-mono"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 bg-cream border border-border text-deep-brown text-sm outline-none focus:border-deep-brown focus:ring-1 focus:ring-deep-brown"
        />
      )}
    </label>
  );
}

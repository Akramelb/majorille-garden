import { AdminNav } from "./AdminNav";

/**
 * Wraps every authenticated admin page. Persistent sidebar on desktop,
 * top-bar + drawer on mobile. Server component so children can be async.
 */
export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <AdminNav userEmail={userEmail} />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}

/** Standard wrapper for an admin page body — keeps spacing consistent. */
export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-5 lg:px-10 py-10 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="serif text-3xl lg:text-4xl text-deep-brown leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted max-w-xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

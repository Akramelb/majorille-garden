import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "./LoginForm";

// Server wrapper — LoginForm uses useSearchParams (?error=…), which requires
// a Suspense boundary to coexist with prerendering.
export default function AdminLogin() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <Container size="sm">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-terracotta">
            Majorille Garden
          </p>
          <h1 className="mt-3 serif text-4xl text-deep-brown">Admin</h1>
        </div>

        <div className="bg-cream border border-border/60 p-8 lg:p-10">
          <Suspense fallback={<div className="h-32" aria-hidden />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center mt-8 text-xs text-muted">
          <Link href="/nl" className="hover:text-deep-brown">
            ← Back to site
          </Link>
        </p>
      </Container>
    </section>
  );
}

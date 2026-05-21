import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <section className="py-32 lg:py-48">
      <Container size="md">
        <div className="text-center">
          <p className="serif text-[8rem] lg:text-[12rem] text-terracotta leading-none">
            404
          </p>
          <h1 className="mt-6 serif text-3xl lg:text-5xl text-deep-brown">
            Deze pagina is verdwaald in de tuin.
          </h1>
          <p className="mt-4 text-muted">
            This page wandered off in the garden — laten we u terugbrengen.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/nl" className="btn-primary">
              Home (NL) <ArrowRight size={14} />
            </Link>
            <Link href="/en" className="btn-secondary">
              Home (EN) <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

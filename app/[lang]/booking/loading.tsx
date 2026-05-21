import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <section className="py-20 lg:py-28">
      <Container size="xl">
        <div className="max-w-3xl mb-14">
          <div className="h-3 w-24 bg-terracotta/40 mb-6 animate-pulse" />
          <div className="h-16 w-3/4 bg-deep-brown/10 mb-4 animate-pulse" />
          <div className="h-4 w-1/2 bg-muted/20 animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-sand/40 animate-pulse" />
            ))}
          </div>
          <div className="bg-sand/20 min-h-[600px] animate-pulse" />
        </div>
      </Container>
    </section>
  );
}

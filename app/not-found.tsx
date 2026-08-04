import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { GeometricLattice } from "@/components/decorative/GeometricLattice";
import { GridColumns } from "@/components/decorative/GridColumns";
import { PageContainer } from "@/components/layout/PageContainer";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Page not found — ${BRAND.name}`,
  description: "This page could not be found. Return to the academy entrance.",
};

export default function NotFound() {
  return (
    <section
      className="relative flex min-h-[70vh] items-center overflow-hidden"
      aria-labelledby="not-found-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <GeometricLattice opacity={0.06} />
        <GridColumns />
      </div>

      <PageContainer className="relative z-10 w-full pt-24 pb-20 lg:pt-32 lg:pb-28">
        <Reveal variant="infill" immediate>
          <p className="dim-label mb-8">Sheet 404</p>
        </Reveal>

        <Reveal variant="hero" immediate delay={80}>
          <p
            className="mb-8 font-serif font-light leading-none tracking-[-0.04em] text-clay tabular-nums text-[clamp(4.5rem,14vw,9rem)]"
            aria-hidden="true"
          >
            404
          </p>
        </Reveal>

        <Reveal variant="hero" immediate delay={140}>
          <h1 id="not-found-heading" className="type-display max-w-3xl mb-6">
            This room isn’t on the floor plan.
          </h1>
        </Reveal>

        <Reveal variant="infill" immediate delay={220}>
          <p className="type-lead max-w-xl mb-12">
            The page you’re looking for has moved, been redrawn, or never
            existed. Let’s get you back to the entrance of {BRAND.name}.
          </p>
        </Reveal>

        <Reveal variant="structural" immediate delay={300}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/" className="cta-entrance">
              Return home
            </Link>
            <Link href="/portfolio" className="action-secondary">
              View portfolio
            </Link>
            <Link href="/contact" className="action-secondary">
              Contact the studio
            </Link>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}

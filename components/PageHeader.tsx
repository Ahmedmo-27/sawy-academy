import { Reveal } from "./Reveal";
import { HeroBackdrop } from "./decorative/HeroBackdrop";
import { GridColumns } from "./decorative/GridColumns";
import { PageContainer } from "./layout/PageContainer";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="relative section-intimate overflow-hidden">
      <HeroBackdrop variant="page" />
      <GridColumns />
      <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-8 lg:pb-12">
        <Reveal variant="infill" immediate>
          <p className="eyebrow mb-3">{eyebrow}</p>
        </Reveal>
        <Reveal variant="hero" immediate delay={80}>
          <h1 className="type-display max-w-4xl">{title}</h1>
        </Reveal>
        {description && (
          <Reveal variant="infill" immediate delay={200}>
            <p className="type-lead mt-6 max-w-xl">{description}</p>
          </Reveal>
        )}
      </PageContainer>
    </header>
  );
}

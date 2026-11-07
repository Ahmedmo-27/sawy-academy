"use client";

import { HeroBackdrop } from "./decorative/HeroBackdrop";
import { GridColumns } from "./decorative/GridColumns";
import { PageContainer } from "./layout/PageContainer";
import { useThemeSlots } from "@/components/theme/slots";
import { useTheme } from "@/lib/themes/ThemeProvider";

export type PageHeaderTone = "neutral" | "warm";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: PageHeaderTone;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  tone = "neutral",
}: PageHeaderProps) {
  const { theme } = useTheme();
  const { Header } = useThemeSlots();
  return (
    <header
      className={`theme-page-header theme-page-header-${theme.layout} page-header-tone page-header-${tone} relative section-intimate overflow-hidden`}
    >
      <HeroBackdrop variant="page" />
      <GridColumns />
      <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-8 lg:pb-12">
        <Header eyebrow={eyebrow} title={title} description={description ?? ""} />
      </PageContainer>
    </header>
  );
}

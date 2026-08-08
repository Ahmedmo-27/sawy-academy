"use client";

import {
  PageHeader,
  type PageHeaderTone,
} from "@/components/PageHeader";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";

const pageTones: Record<string, PageHeaderTone> = {
  // Public content shares the clay brand treatment; utility flows stay neutral.
  portfolio: "warm",
  products: "warm",
  services: "warm",
  courses: "warm",
  researches: "warm",
};

interface CmsPageHeaderProps {
  pageKey: string;
  /** Optional overrides when a page needs dynamic bits */
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: PageHeaderTone;
}

export function CmsPageHeader({
  pageKey,
  eyebrow,
  title,
  description,
  tone,
}: CmsPageHeaderProps) {
  const { getPageHeader } = useSiteSettings();
  const header = getPageHeader(pageKey);

  return (
    <PageHeader
      eyebrow={eyebrow ?? header.eyebrow}
      title={title ?? header.title}
      description={description ?? header.description}
      tone={tone ?? pageTones[pageKey] ?? "neutral"}
    />
  );
}

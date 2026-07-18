"use client";

import { PageHeader } from "@/components/PageHeader";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";

interface CmsPageHeaderProps {
  pageKey: string;
  /** Optional overrides when a page needs dynamic bits */
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function CmsPageHeader({
  pageKey,
  eyebrow,
  title,
  description,
}: CmsPageHeaderProps) {
  const { getPageHeader } = useSiteSettings();
  const header = getPageHeader(pageKey);

  return (
    <PageHeader
      eyebrow={eyebrow ?? header.eyebrow}
      title={title ?? header.title}
      description={description ?? header.description}
    />
  );
}

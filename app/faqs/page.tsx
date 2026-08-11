import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { FaqStudio } from "@/components/faqs/FaqStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { getServerFaqList } from "@/lib/api/faqs.server";
import type { Faq } from "@/lib/api/types";

export default async function FaqsPage() {
  let faqs: Faq[] = [];
  let loadError = false;

  try {
    faqs = await getServerFaqList();
  } catch {
    loadError = true;
  }

  return (
    <>
      <CmsPageHeader pageKey="faqs" />
      <ThresholdDoorway label="COMMON QUESTIONS" />
      <FaqStudio faqs={faqs} loadError={loadError} />
    </>
  );
}

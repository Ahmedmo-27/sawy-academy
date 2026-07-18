import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditResearchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditResearchPage({
  params,
}: EditResearchPageProps) {
  const { slug } = await params;
  return <ResourceFormPage kind="research" lookupKey={slug} />;
}

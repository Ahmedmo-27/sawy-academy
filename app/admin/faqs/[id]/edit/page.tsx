import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditFaqPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const { id } = await params;
  return <ResourceFormPage kind="faqs" lookupKey={id} />;
}

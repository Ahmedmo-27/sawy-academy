import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  return <ResourceFormPage kind="portfolio" lookupKey={slug} />;
}

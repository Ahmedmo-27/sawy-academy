import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <ResourceFormPage kind="products" lookupKey={id} />;
}

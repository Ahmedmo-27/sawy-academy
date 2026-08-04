import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  return <ResourceFormPage kind="users" lookupKey={id} />;
}

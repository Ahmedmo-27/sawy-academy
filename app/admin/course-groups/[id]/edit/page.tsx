import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditCourseGroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCourseGroupPage({
  params,
}: EditCourseGroupPageProps) {
  const { id } = await params;
  return (
    <ResourceFormPage
      kind="course-groups"
      lookupKey={decodeURIComponent(id)}
    />
  );
}

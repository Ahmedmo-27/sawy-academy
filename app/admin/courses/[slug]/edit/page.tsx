import { ResourceFormPage } from "@/components/admin/ResourceFormPage";

interface EditCoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { slug } = await params;
  return <ResourceFormPage kind="courses" lookupKey={slug} />;
}

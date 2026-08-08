import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  return {
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/courses/${encodeURIComponent(slug)}/${encodeURIComponent(
        lessonSlug
      )}`,
    },
  };
}

export default function LessonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

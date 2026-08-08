import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: { canonical: `/courses/${encodeURIComponent(slug)}` },
  };
}

export default function CourseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

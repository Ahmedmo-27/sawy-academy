import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture Courses",
  description:
    "Browse Sawy Academy architecture programmes, leveled courses, and studio learning resources.",
  alternates: { canonical: "/courses" },
};

export default function CoursesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

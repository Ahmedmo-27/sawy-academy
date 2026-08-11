import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about enrolment, payments, courses, and studio visits at Sawy Academy.",
  alternates: { canonical: "/faqs" },
};

export default function FaqsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

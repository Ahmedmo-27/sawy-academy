import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for student accounts, course enrollment, intellectual property protection, and platform conduct at Sawy Academy.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Sawy Academy collects, uses, and protects personal information for accounts, courses, orders, and studio correspondence.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

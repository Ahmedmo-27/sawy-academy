import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture Studio Shop",
  description:
    "Browse architecture studio resources and products from Sawy Academy.",
  alternates: { canonical: "/products" },
};

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

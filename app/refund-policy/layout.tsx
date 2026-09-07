import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Information regarding payment verification, course enrollment refunds, and digital content access policies at Sawy Academy.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

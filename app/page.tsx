import type { Metadata } from "next";
import { HomePageStudio } from "@/components/cms/HomePageStudio";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomePageStudio />;
}

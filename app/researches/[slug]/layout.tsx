import type { Metadata } from "next";
import { getServerResearch } from "@/lib/api/research.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/researches/${encodeURIComponent(slug)}`;
  try {
    const research = await getServerResearch(slug);
    const description =
      research.abstract.length > 160
        ? `${research.abstract.slice(0, 157).trimEnd()}…`
        : research.abstract;
    return {
      title: research.title,
      description,
      authors: research.authors?.map((name) => ({ name })),
      keywords: research.keywords,
      alternates: { canonical },
      openGraph: {
        type: "article",
        title: research.title,
        description,
        url: canonical,
        publishedTime: research.publicationDate,
        authors: research.authors,
        images: research.image ? [{ url: research.image, alt: research.title }] : undefined,
      },
      twitter: {
        card: research.image ? "summary_large_image" : "summary",
        title: research.title,
        description,
        images: research.image ? [research.image] : undefined,
      },
    };
  } catch {
    return {
      title: "Architecture Research",
      description: "Research publication from Sawy Academy.",
      alternates: { canonical },
    };
  }
}

export default function ResearchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

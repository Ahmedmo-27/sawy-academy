import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getServerResearchList } from "@/lib/api/research.server";

const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.9 },
  { path: "/portfolio", changeFrequency: "weekly", priority: 0.9 },
  { path: "/researches", changeFrequency: "monthly", priority: 0.8 },
  { path: "/products", changeFrequency: "weekly", priority: 0.8 },
  { path: "/services", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const routes: MetadataRoute.Sitemap = publicRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: new URL(path, siteUrl).toString(),
      changeFrequency,
      priority,
    })
  );

  try {
    const researches = await getServerResearchList();
    routes.push(
      ...researches.map((research) => ({
        url: new URL(
          `/researches/${encodeURIComponent(research.slug)}`,
          siteUrl
        ).toString(),
        lastModified: research.updatedAt ?? research.publicationDate,
        changeFrequency: "yearly" as const,
        priority: 0.7,
      }))
    );
  } catch {
    // Keep the static sitemap available if the API is temporarily unavailable.
  }

  return routes;
}

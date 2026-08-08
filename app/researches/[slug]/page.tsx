import Link from "next/link";
import { notFound } from "next/navigation";
import { GsapReveal } from "@/components/animation/GsapReveal";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { GridColumns } from "@/components/decorative/GridColumns";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { MediaGallery } from "@/components/media/MediaGallery";
import {
  getServerResearch,
  ServerResearchError,
} from "@/lib/api/research.server";
import { getSiteUrl } from "@/lib/site-url";

interface ResearchDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatPublicationDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function ResearchDetailPage({
  params,
}: ResearchDetailPageProps) {
  const { slug } = await params;
  let research;
  try {
    research = await getServerResearch(slug);
  } catch (error) {
    if (error instanceof ServerResearchError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const paragraphs = research.abstract.split(/\n\n+/).filter(Boolean);
  const figures = research.figures ?? [];
  const publicationDate = formatPublicationDate(research.publicationDate);
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: research.title,
    description: research.abstract,
    datePublished: research.publicationDate,
    author: research.authors?.map((name) => ({
      "@type": "Person",
      name,
    })),
    keywords: research.keywords?.join(", "),
    citation: research.citation,
    identifier: research.doi
      ? { "@type": "PropertyValue", propertyID: "DOI", value: research.doi }
      : undefined,
    image: research.image
      ? new URL(research.image, siteUrl).toString()
      : undefined,
    url: new URL(`/researches/${encodeURIComponent(slug)}`, siteUrl).toString(),
    sameAs:
      research.externalUrl ??
      (research.doi ? `https://doi.org/${research.doi}` : undefined),
    publisher: {
      "@type": "Organization",
      name: "Sawy Academy",
      url: siteUrl.toString(),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <header className="page-header-warm relative overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-8 lg:pb-12">
          <GsapReveal type="text" immediate>
            <p className="eyebrow mb-3">
              Research · {research.category} · {research.year}
            </p>
          </GsapReveal>
          <SplitTextReveal type="lines" immediate>
            <h1 className="type-display max-w-4xl mb-8">{research.title}</h1>
          </SplitTextReveal>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <MediaBay
                src={research.image}
                alt={research.title}
                className="aspect-[4/3] sm:aspect-[4/5]"
                fallback="research"
                morph
                priority
                revealOnLoad
              />
            </div>
            <div className="hairline-border p-6 lg:p-8 lg:col-span-7 bg-concrete/80">
              <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="label-caps mb-2">Category</p>
                  <p className="type-infill">{research.category}</p>
                </div>
                <div>
                  <p className="label-caps mb-2">Year</p>
                  <p className="type-infill">{research.year}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="label-caps mb-2">Venue</p>
                  <p className="type-infill">{research.venue}</p>
                </div>
                {publicationDate && (
                  <div className="col-span-2 sm:col-span-1">
                    <p className="label-caps mb-2">Published</p>
                    <p className="type-infill">{publicationDate}</p>
                  </div>
                )}
                {research.doi && (
                  <div className="col-span-2 sm:col-span-2">
                    <p className="label-caps mb-2">DOI</p>
                    <a
                      href={`https://doi.org/${research.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="type-infill break-all underline decoration-hairline underline-offset-4 hover:text-clay"
                    >
                      {research.doi}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <ThresholdDoorway label={research.slug} />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <ThresholdFrame label={`Abstract — ${research.title}`}>
            <article className="hairline-border p-6 lg:p-10 mt-4 max-w-3xl">
              <div className="space-y-6">
                {paragraphs.map((paragraph) => (
                  <GsapReveal key={paragraph.slice(0, 32)} type="text">
                    <p className="type-body">{paragraph}</p>
                  </GsapReveal>
                ))}
              </div>

              {research.collaborators && (
                <div className="mt-10 hairline-t pt-8">
                  <p className="label-caps mb-2">Collaborators</p>
                  <p className="type-infill">{research.collaborators}</p>
                </div>
              )}

              {research.authors && research.authors.length > 0 && (
                <div className="mt-10 hairline-t pt-8">
                  <p className="label-caps mb-2">Authors</p>
                  <p className="type-infill">{research.authors.join(", ")}</p>
                </div>
              )}

              {research.keywords && research.keywords.length > 0 && (
                <div className="mt-8 hairline-t pt-8">
                  <p className="label-caps mb-3">Keywords</p>
                  <ul className="flex flex-wrap gap-2" aria-label="Research keywords">
                    {research.keywords.map((keyword) => (
                      <li
                        key={keyword}
                        className="hairline-border px-3 py-2 label-caps"
                      >
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {research.citation && (
                <div className="mt-8 hairline-t pt-8">
                  <p className="label-caps mb-2">Preferred citation</p>
                  <blockquote className="type-infill">{research.citation}</blockquote>
                </div>
              )}

              {(research.pdfUrl || research.externalUrl) && (
                <div className="mt-8 flex flex-wrap gap-4 hairline-t pt-8">
                  {research.pdfUrl && (
                    <a
                      href={research.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="action-primary"
                    >
                      Read PDF
                    </a>
                  )}
                  {research.externalUrl && (
                    <a
                      href={research.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="action-secondary"
                    >
                      View publication
                    </a>
                  )}
                </div>
              )}

              <div className="mt-12">
                <Link href="/researches" className="action-secondary">
                  ← Research index
                </Link>
              </div>
            </article>
          </ThresholdFrame>
        </PageContainer>
      </Section>

      {figures.length > 0 && (
        <Section rhythm="intimate" contained={false}>
          <PageContainer>
            <ThresholdFrame label="Figure plates">
              <div className="pt-6">
                <MediaGallery images={figures} title={research.title} fallback="research" />
              </div>
            </ThresholdFrame>
          </PageContainer>
        </Section>
      )}
    </>
  );
}

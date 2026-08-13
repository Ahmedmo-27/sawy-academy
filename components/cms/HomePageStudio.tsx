"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { HeroConstruction } from "@/components/animation/HeroConstruction";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { PinScrubStats } from "@/components/animation/PinScrubStats";
import { HeroBackdrop } from "@/components/decorative/HeroBackdrop";
import { GridColumns } from "@/components/decorative/GridColumns";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { MediaBay } from "@/components/decorative/MediaBay";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { PortraitSilhouette } from "@/components/decorative/PortraitSilhouette";
import { Magnetic } from "@/components/animation/Magnetic";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { listCourseGroups } from "@/lib/api/courseGroups";
import { getHomePage } from "@/lib/api/homepage";
import { listProjects } from "@/lib/api/portfolio";
import { listProducts } from "@/lib/api/products";
import { listResearch } from "@/lib/api/research";
import type {
  CourseGroup,
  HomeSection,
  Product,
  Project,
  Research,
} from "@/lib/api/types";
import { toSlug } from "@/lib/slug";
import { runParallelStagedLoad } from "@/lib/load/stagedLoad";
import { safeHref } from "@/lib/safeHref";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function SectionHeader({
  room,
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  room: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  const safeLink = safeHref(href);
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
      <div className="flex items-start gap-6">
        <span className="dim-label pt-1">{room}</span>
        <div>
          <p className="eyebrow mb-2">{eyebrow}</p>
          <SplitTextReveal type="lines">
            <h2 className="type-heading">{title}</h2>
          </SplitTextReveal>
        </div>
      </div>
      {safeLink && linkLabel && (
        <GsapReveal type="text" delay={0.06}>
          <Link href={safeLink} className="action-secondary shrink-0">
            {linkLabel}
          </Link>
        </GsapReveal>
      )}
    </div>
  );
}

function groupHref(group: CourseGroup) {
  if (group.slug) return `/courses/${group.slug}`;
  return `/courses/${toSlug(group.title)}`;
}

function HeroSection({
  content,
}: {
  content: Record<string, unknown>;
}) {
  const jumpLinks = Array.isArray(content.jumpLinks)
    ? (content.jumpLinks as Array<{ href?: string; label?: string }>)
    : [];
  const heroImageUrl = text(content.heroImageUrl);

  return (
    <section className="relative overflow-x-clip" aria-label="Entrance">
      <HeroBackdrop variant="home" />
      <HeroConstruction />
      <GridColumns />

      <PageContainer className="relative z-10 pt-[calc(var(--nav-height)+3rem+env(safe-area-inset-top))] pb-8 sm:pt-32 sm:pb-12 lg:pt-40 lg:pb-16">
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center lg:gap-6">
          <div className="order-2 min-w-0 max-w-full lg:order-none lg:col-span-5 lg:pr-4">
            <GsapReveal type="text" immediate className="min-w-0 max-w-full">
              <p className="eyebrow mb-3 break-words">
                {text(content.tagline)}
              </p>
            </GsapReveal>
            <GsapReveal
              type="heading"
              immediate
              delay={0.1}
              className="min-w-0 max-w-full"
            >
              <h1 className="type-display max-w-full sm:max-w-xl lg:max-w-2xl mb-4 sm:mb-5 leading-[1.14] sm:leading-[1.1] text-balance">
                {text(content.headline)}
              </h1>
            </GsapReveal>
            <GsapReveal
              type="text"
              immediate
              delay={0.22}
              className="min-w-0 max-w-full"
            >
              <p className="type-body max-w-full sm:max-w-md mb-6 sm:mb-8">
                {text(content.body)}
              </p>
            </GsapReveal>
            <GsapReveal
              type="text"
              immediate
              delay={0.4}
              className="min-w-0 max-w-full"
            >
              <div className="flex flex-col sm:flex-row sm:flex-nowrap items-stretch sm:items-center gap-4 sm:gap-4 mb-6 sm:mb-8">
                {safeHref(content.primaryCtaHref) && (
                  <Link
                    href={safeHref(content.primaryCtaHref)}
                    className="cta-entrance w-full sm:w-auto justify-center sm:justify-start"
                  >
                    {text(content.primaryCtaLabel, "View")}
                  </Link>
                )}
                {safeHref(content.secondaryCtaHref) && (
                  <Link
                    href={safeHref(content.secondaryCtaHref)}
                    className="action-secondary self-start sm:self-center py-3 sm:py-0"
                  >
                    {text(content.secondaryCtaLabel, "Browse")}
                  </Link>
                )}
              </div>
              <ScaleBar scale="1:200" className="hidden sm:block max-w-[200px]" />
            </GsapReveal>

            {jumpLinks.length > 0 && (
              <GsapReveal
                type="text"
                immediate
                delay={0.46}
                className="min-w-0 max-w-full"
              >
                <nav
                  className="mt-6 sm:mt-8 pt-5 sm:pt-6 hairline-t"
                  aria-label="Jump to rooms"
                >
                  <p className="label-caps mb-2 sm:mb-3">
                    {text(content.floorPlanLabel, "Floor plan")}
                  </p>
                  <ul className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
                    {jumpLinks.map((link, i) => {
                      const href = safeHref(link.href);
                      if (!href) return null;
                      return (
                        <li key={`${href}-${i}`} className="min-w-0">
                          <a href={href} className="action-secondary">
                            {text(link.label)}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </GsapReveal>
            )}
          </div>

          <div className="order-1 min-w-0 max-w-full lg:order-none lg:col-span-7 mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:mx-0 lg:max-w-none lg:-translate-y-8">
            <GsapReveal
              type="image"
              immediate
              delay={0.18}
              className="min-w-0 max-w-full"
            >
              <ImageFrame className="aspect-[4/3] sm:aspect-[4/3] lg:aspect-[3/4] max-h-[min(40svh,280px)] sm:max-h-[min(42svh,320px)] lg:max-h-[min(68svh,680px)] bg-concrete-dark/20">
                {heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PortraitSilhouette />
                )}
              </ImageFrame>
            </GsapReveal>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function PhilosophySection({ content }: { content: Record<string, unknown> }) {
  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "PHILOSOPHY")} />
      <Section id="philosophy" rhythm="atrium" contained={false}>
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-1">
              <span className="dim-label">
                {text(content.roomNumber, "01")}
              </span>
            </div>
            <div className="lg:col-span-7">
              <blockquote>
                <GsapReveal type="heading">
                  <p className="type-display leading-snug mb-6">
                    {text(content.quote)}
                  </p>
                </GsapReveal>
                <GsapReveal type="text" delay={0.08}>
                  <footer className="eyebrow text-clay">
                    — {text(content.attribution)}
                  </footer>
                </GsapReveal>
              </blockquote>
            </div>
            <div className="lg:col-span-4">
              <GsapReveal type="image">
                <MediaBay
                  src={text(content.philosophyImageUrl)}
                  alt="Philosophy diagram"
                  className="aspect-[4/3] lg:aspect-[4/5]"
                  fallback="plan"
                  morph
                />
              </GsapReveal>
            </div>
          </div>
        </PageContainer>
      </Section>
    </>
  );
}

function PortfolioSection({
  content,
  projects,
}: {
  content: Record<string, unknown>;
  projects: Project[];
}) {
  const limit = num(content.featuredLimit, 3);
  const featured = limit > 0 ? projects.slice(0, limit) : projects;
  const usePinGallery = featured.length >= 2;

  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "PORTFOLIO")} />
      <Section
        id="portfolio"
        rhythm="standard"
        contained={false}
        className="room-field-warm"
      >
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "02")}
            eyebrow={text(content.eyebrow, "Work")}
            title={text(content.title, "Portfolio")}
            href={safeHref(content.href, "/portfolio")}
            linkLabel={text(content.linkLabel, "All projects")}
          />
          <ThresholdFrame
            label={text(content.thresholdLabel, "Featured")}
          >
            {usePinGallery ? (
              <div className="pt-6">
                <HorizontalPinGallery>
                  {featured.map((project) => (
                    <div
                      key={project.id}
                      className="w-[min(88vw,24rem)] shrink-0 bg-concrete sm:w-[min(42vw,28rem)]"
                    >
                      <ProjectCard
                        title={project.title}
                        category={project.category}
                        year={project.year}
                        image={project.image}
                        sheetRef={project.sheetRef ?? ""}
                        href={`/portfolio/${project.slug}`}
                      />
                    </div>
                  ))}
                </HorizontalPinGallery>
              </div>
            ) : (
              <GsapStagger className="bay-grid pt-6">
                {featured.map((project) => (
                  <div
                    key={project.id}
                    className="col-span-12 md:col-span-4 bg-concrete"
                  >
                    <ProjectCard
                      title={project.title}
                      category={project.category}
                      year={project.year}
                      image={project.image}
                      sheetRef={project.sheetRef ?? ""}
                      href={`/portfolio/${project.slug}`}
                    />
                  </div>
                ))}
              </GsapStagger>
            )}
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

function StudioPulseSection({
  projects,
  groups,
  researches,
}: {
  projects: Project[];
  groups: CourseGroup[];
  researches: Research[];
}) {
  const featuredProject = projects[0];
  const featuredGroup = groups[0];
  const featuredResearch = researches[0];
  const courseVisual =
    featuredGroup?.image ||
    projects[1]?.image ||
    featuredProject?.image;
  const researchVisual =
    featuredResearch?.image ||
    projects[2]?.image ||
    projects[1]?.image ||
    featuredProject?.image;

  const items = [
    {
      value: `${Math.max(projects.length, 1)}+`,
      label: "Featured works",
      meta: featuredProject
        ? `${featuredProject.title} · ${featuredProject.year}`
        : "Studio archive",
      detail: featuredProject
        ? `${featuredProject.category} work from the portfolio — scroll to hold on each measure of output.`
        : "Built work from the studio archive.",
      image: featuredProject?.image,
      imageAlt: featuredProject?.title,
      href: "/portfolio",
      linkLabel: "Open portfolio",
    },
    {
      value: `${Math.max(groups.length, 1)}`,
      label: "Course programmes",
      meta: featuredGroup?.title ?? "Curriculum",
      detail:
        featuredGroup?.subtitle ??
        "Structured programmes spanning diploma and leveled study.",
      image: courseVisual,
      imageAlt: featuredGroup?.title ?? "Course programmes",
      href: featuredGroup ? groupHref(featuredGroup) : "/courses",
      linkLabel: "Browse courses",
    },
    {
      value: `${Math.max(researches.length, 1)}+`,
      label: "Research notes",
      meta: featuredResearch
        ? `${featuredResearch.title} · ${featuredResearch.year}`
        : "Inquiry ledger",
      detail: featuredResearch
        ? `${featuredResearch.venue}. ${featuredResearch.abstract.slice(0, 140)}${
            featuredResearch.abstract.length > 140 ? "…" : ""
          }`
        : "Published notes, conferences, and ongoing inquiry.",
      image: researchVisual,
      imageAlt: featuredResearch?.title ?? "Research notes",
      href: featuredResearch?.slug
        ? `/researches/${featuredResearch.slug}`
        : "/researches",
      linkLabel: "Read research",
    },
  ];

  return (
    <Section id="studio-pulse" rhythm="intimate" contained={false} className="overflow-x-clip">
      <PageContainer className="overflow-x-clip">
        <div className="mb-8 flex items-start gap-6">
          <span className="dim-label pt-1">01.5</span>
          <div>
            <p className="eyebrow mb-2">Studio pulse</p>
            <SplitTextReveal type="words">
              <h2 className="type-heading">Scale of practice</h2>
            </SplitTextReveal>
          </div>
        </div>
        <PinScrubStats items={items} />
      </PageContainer>
    </Section>
  );
}

function CoursesSection({
  content,
  groups,
}: {
  content: Record<string, unknown>;
  groups: CourseGroup[];
}) {
  const limit = num(content.featuredLimit, 0);
  const featured = limit > 0 ? groups.slice(0, limit) : groups;

  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "COURSES")} />
      <Section
        id="courses"
        rhythm="standard"
        contained={false}
        className="room-field-quiet"
      >
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "03")}
            eyebrow={text(content.eyebrow, "Education")}
            title={text(content.title, "Courses")}
            href={safeHref(content.href, "/courses")}
            linkLabel={text(content.linkLabel, "Full curriculum")}
          />
          <ThresholdFrame label={text(content.thresholdLabel, "Programme index")}>
            <GsapStagger className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline mt-6">
              {featured.map((group) => {
                const courses = (group.courses ?? []).filter(
                  (c): c is NonNullable<typeof c> & object =>
                    typeof c === "object" && c !== null
                );
                const first = courses[0];
                return (
                  <div
                    key={group._id ?? group.id ?? group.title}
                    className="bg-concrete p-6 lg:p-8 flex flex-col elevation-surface"
                  >
                    <MediaBay
                      src={group.image}
                      alt={group.title}
                      className="aspect-[16/10] mb-6"
                      fallback="course"
                      morph
                    />
                    <p className="eyebrow mb-2">{group.subtitle}</p>
                    <h3 className="type-title mb-3">{group.title}</h3>
                    <p className="type-infill mb-6 flex-1">
                      {first && "description" in first
                        ? String(first.description ?? "")
                        : ""}
                    </p>
                    <div className="hairline-t pt-6 space-y-4">
                      <span className="label-caps">
                        {courses.length} courses
                      </span>
                      {group.type === "leveled" && (
                        <LevelProgressLine
                          progress={1}
                          className="max-w-[100px]"
                        />
                      )}
                      {group.bundlePrice ? (
                        <p className="type-display text-clay">
                          {group.bundlePrice}
                        </p>
                      ) : (
                        <p className="type-infill">
                          From{" "}
                          {first && "price" in first
                            ? String(first.price ?? "")
                            : ""}
                        </p>
                      )}
                      <Link
                        href={groupHref(group)}
                        className="action-secondary"
                      >
                        View syllabus
                      </Link>
                    </div>
                  </div>
                );
              })}
            </GsapStagger>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

function ProductsSection({
  content,
  products,
}: {
  content: Record<string, unknown>;
  products: Product[];
}) {
  const limit = num(content.featuredLimit, 4);
  const featured = limit > 0 ? products.slice(0, limit) : products;

  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "PRODUCTS")} />
      <Section id="products" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "04")}
            eyebrow={text(content.eyebrow, "Studio shop")}
            title={text(content.title, "Products")}
            href={safeHref(content.href, "/products")}
            linkLabel={text(content.linkLabel, "Full catalogue")}
          />
          <ThresholdFrame
            label={text(content.thresholdLabel, "Featured")}
          >
            <GsapStagger className="bay-grid pt-6">
              {featured.map((product) => (
                <div
                  key={product.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-3 bg-concrete group"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    category={product.category}
                    description={product.description}
                    price={product.price}
                    image={product.image}
                  />
                </div>
              ))}
            </GsapStagger>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

function ResearchSection({
  content,
  researches,
}: {
  content: Record<string, unknown>;
  researches: Research[];
}) {
  const limit = num(content.featuredLimit, 3);
  const featured = limit > 0 ? researches.slice(0, limit) : researches;

  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "RESEARCH")} />
      <Section
        id="researches"
        rhythm="standard"
        contained={false}
        className="room-field-warm"
      >
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "05")}
            eyebrow={text(content.eyebrow, "Scholarship")}
            title={text(content.title, "Research")}
            href={safeHref(content.href, "/researches")}
            linkLabel={text(content.linkLabel, "All publications")}
          />
          <ThresholdFrame
            label={text(content.thresholdLabel, "Bibliography")}
          >
            <div className="mt-6 space-y-0">
              {featured.map((item, i) => (
                <GsapReveal key={item.id} type="card" delay={i * 0.055}>
                  <article className={`py-8 ${i > 0 ? "hairline-t" : ""}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                      <div className="lg:col-span-3">
                        <MediaBay
                          src={item.image}
                          alt={item.title}
                          className="aspect-[4/3] sm:aspect-[4/5] max-w-[18rem] sm:max-w-[12rem]"
                          fallback="research"
                          morph
                        />
                        <div className="mt-4 flex gap-4 lg:flex-col lg:gap-2">
                          <span className="label-caps">{item.category}</span>
                          <span className="label-caps text-charcoal-infill">
                            {item.year}
                          </span>
                        </div>
                      </div>
                      <div className="lg:col-span-9">
                        <h3 className="type-title mb-2">
                          {item.title}
                        </h3>
                        <p className="label-caps mb-3 text-charcoal-infill">
                          {item.venue}
                        </p>
                        <p className="type-infill line-clamp-2">
                          {item.abstract}
                        </p>
                      </div>
                    </div>
                  </article>
                </GsapReveal>
              ))}
            </div>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

function ContactSection({
  content,
}: {
  content: Record<string, unknown>;
}) {
  const { branding } = useSiteSettings();

  return (
    <>
      <ThresholdDoorway label={text(content.roomLabel, "CONTACT")} />
      <Section id="contact" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "06")}
            eyebrow={text(content.eyebrow, "Correspondence")}
            title={text(content.title, "Contact")}
            href={safeHref(content.href, "/contact")}
            linkLabel={text(content.linkLabel, "Send a message")}
          />
          <GsapReveal type="card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-hairline">
              <div className="bg-concrete p-6 lg:p-10 lg:col-span-5 elevation-surface">
                <p className="type-infill max-w-lg mb-8">
                  {text(content.body)}
                </p>
                <Magnetic>
                  <Link
                    href={safeHref(content.href, "/contact")}
                    className="cta-entrance"
                  >
                    {text(content.ctaLabel, "Open contact form")}
                  </Link>
                </Magnetic>
              </div>
              <div className="bg-concrete lg:col-span-3">
                <MediaBay
                  src={text(content.contactImageUrl)}
                  alt="Studio"
                  className="aspect-[16/10] lg:aspect-[3/4] h-full min-h-[14rem]"
                  fallback="service"
                  morph
                />
              </div>
              <div className="bg-concrete-dark/40 p-6 lg:p-10 lg:col-span-4">
                <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
                <dl className="space-y-6">
                  <div>
                    <dt className="label-caps mb-2">Email</dt>
                    <dd className="type-infill">{branding.email}</dd>
                  </div>
                  <div>
                    <dt className="label-caps mb-2">Telephone</dt>
                    <dd className="type-infill">{branding.phone}</dd>
                  </div>
                  <div>
                    <dt className="label-caps mb-2">Studio</dt>
                    <dd className="type-infill">
                      {branding.address.line1}
                      <br />
                      {branding.address.line2}, {branding.address.country}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </GsapReveal>
        </PageContainer>
      </Section>
    </>
  );
}

function CustomSection({ content }: { content: Record<string, unknown> }) {
  return (
    <>
      {text(content.roomLabel) && (
        <ThresholdDoorway label={text(content.roomLabel)} />
      )}
      <Section
        id={text(content.anchorId) || undefined}
        rhythm="standard"
        contained={false}
      >
        <PageContainer>
          <SectionHeader
            room={text(content.roomNumber, "")}
            eyebrow={text(content.eyebrow)}
            title={text(content.title)}
            href={safeHref(content.href)}
            linkLabel={text(content.linkLabel)}
          />
          {text(content.body) && (
            <GsapReveal type="text">
              <p className="type-body max-w-2xl">
                {text(content.body)}
              </p>
            </GsapReveal>
          )}
          <GsapReveal type="image" delay={0.08} className="mt-10">
            <MediaBay
              src={text(content.customImageUrl)}
              alt={text(content.title, "Studio media")}
              className="aspect-[16/10] lg:aspect-[21/9]"
              fallback="plan"
              morph
            />
          </GsapReveal>
        </PageContainer>
      </Section>
    </>
  );
}

export function HomePageStudio() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [researches, setResearches] = useState<Research[]>([]);
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStepLabel, setLoadStepLabel] = useState("Loading studio…");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [home, portfolio, courseGroups, shop, research] =
          await runParallelStagedLoad(
            [
              { label: "Homepage layout", run: getHomePage },
              {
                label: "Portfolio projects",
                run: () => listProjects().catch(() => [] as Project[]),
              },
              {
                label: "Course groups",
                run: () => listCourseGroups().catch(() => [] as CourseGroup[]),
              },
              {
                label: "Shop products",
                run: () => listProducts().catch(() => [] as Product[]),
              },
              {
                label: "Research entries",
                run: () => listResearch().catch(() => [] as Research[]),
              },
            ],
            ({ progress, stepLabel }) => {
              if (cancelled) return;
              setLoadProgress(progress);
              setLoadStepLabel(stepLabel);
            }
          );

        if (cancelled) return;
        setSections(
          (home.sections ?? [])
            .filter((s) => s.enabled !== false)
            .sort((a, b) => a.order - b.order)
        );
        setProjects(
          [...portfolio].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );
        setGroups(courseGroups);
        setProducts(shop);
        setResearches(research);
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <PageContainer className="min-h-[var(--app-height)] pt-[calc(var(--nav-height)+4rem)] pb-20">
        <SectionLoader
          label="Loading studio…"
          stepLabel={loadStepLabel}
          progress={loadProgress}
          fullScreen
        />
      </PageContainer>
    );
  }

  return (
    <>
      {sections.map((section, index) => {
        const content = section.content ?? {};
        const node = (() => {
          switch (section.type) {
            case "hero":
              return <HeroSection content={content} />;
            case "philosophy":
              return <PhilosophySection content={content} />;
            case "portfolio":
              return (
                <PortfolioSection content={content} projects={projects} />
              );
            case "courses":
              return <CoursesSection content={content} groups={groups} />;
            case "products":
              return (
                <ProductsSection content={content} products={products} />
              );
            case "research":
              return (
                <ResearchSection
                  content={content}
                  researches={researches}
                />
              );
            case "contact":
              return <ContactSection content={content} />;
            case "custom":
              return <CustomSection content={content} />;
            default:
              return null;
          }
        })();

        const next = sections[index + 1];
        const insertPulse =
          section.type === "philosophy" ||
          (section.type === "hero" && next?.type === "portfolio");

        return (
          <div key={section.id}>
            {node}
            {insertPulse ? (
              <StudioPulseSection
                projects={projects}
                groups={groups}
                researches={researches}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

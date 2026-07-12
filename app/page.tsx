import Link from "next/link";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { HeroConstruction } from "@/components/animation/HeroConstruction";
import { BRAND } from "@/lib/branding";
import { HeroBackdrop } from "@/components/decorative/HeroBackdrop";
import { GridColumns } from "@/components/decorative/GridColumns";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { PortraitSilhouette } from "@/components/decorative/PortraitSilhouette";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { featuredProjects } from "@/lib/data/portfolio";
import { courseGroups } from "@/lib/data/courses";
import { products } from "@/lib/data/products";
import { researches } from "@/lib/data/researches";

const sectionLinks = [
  { href: "#portfolio", label: "Portfolio" },
  { href: "#courses", label: "Courses" },
  { href: "#products", label: "Products" },
  { href: "#researches", label: "Research" },
  { href: "#contact", label: "Contact" },
] as const;

const featuredProducts = products.slice(0, 4);
const featuredResearches = researches.slice(0, 3);

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
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
      <div className="flex items-start gap-6">
        <span className="dim-label pt-1">{room}</span>
        <div>
          <p className="eyebrow mb-2">{eyebrow}</p>
          <GsapReveal type="heading">
            <h2 className="type-heading">{title}</h2>
          </GsapReveal>
        </div>
      </div>
      <GsapReveal type="text" delay={0.06}>
        <Link href={href} className="action-secondary shrink-0">
          {linkLabel}
        </Link>
      </GsapReveal>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ENTRANCE — lobby landmark */}
      <section className="relative overflow-x-clip" aria-label="Entrance">
        <HeroBackdrop variant="home" />
        <HeroConstruction />
        <GridColumns />

        <PageContainer className="relative z-10 pt-[calc(var(--nav-height)+0.5rem+env(safe-area-inset-top))] sm:pt-32 lg:pt-40 pb-8 sm:pb-12 lg:pb-16">
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="order-2 min-w-0 lg:order-none col-span-12 lg:col-span-5 lg:pr-8">
              <GsapReveal type="text" immediate>
                <p className="eyebrow mb-3">{BRAND.tagline}</p>
              </GsapReveal>
              <GsapReveal type="heading" immediate delay={0.1}>
                <h1 className="type-display max-w-full sm:max-w-xl lg:max-w-2xl mb-4 sm:mb-5 leading-[1.14] sm:leading-[1.1] text-balance">
                  Designing spaces that teach us how to inhabit the world.
                </h1>
              </GsapReveal>
              <GsapReveal type="text" immediate delay={0.22}>
                <p className="type-body max-w-full sm:max-w-md mb-8">
                  {BRAND.professorTitle} — founder of {BRAND.name}. Practice,
                  pedagogy, and research in Cairo.
                </p>
              </GsapReveal>
              <GsapReveal type="text" immediate delay={0.4}>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <Link href="/portfolio" className="cta-entrance w-full sm:w-auto text-center sm:text-left justify-center">
                    View portfolio
                  </Link>
                  <Link href="/courses" className="action-secondary w-full sm:w-auto text-center sm:text-left justify-center sm:justify-start py-3 sm:py-0">
                    Browse courses
                  </Link>
                </div>
                <ScaleBar scale="1:200" className="hidden sm:block max-w-[200px]" />
              </GsapReveal>

              <GsapReveal type="text" immediate delay={0.46}>
                <nav
                  className="mt-6 sm:mt-8 pt-5 sm:pt-6 hairline-t"
                  aria-label="Jump to rooms"
                >
                  <p className="label-caps mb-2 sm:mb-3">Floor plan</p>
                  <ul className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
                    {sectionLinks.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="action-secondary">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </GsapReveal>
            </div>

            <div className="order-1 min-w-0 lg:order-none col-span-12 lg:col-span-7 mx-auto w-full max-w-[18rem] sm:max-w-xs md:max-w-sm lg:mx-0 lg:max-w-none lg:-translate-y-8">
              <GsapReveal type="image" immediate delay={0.18}>
                <ImageFrame className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[3/4] max-h-[min(38vh,280px)] sm:max-h-[min(42vh,320px)] lg:max-h-[min(68vh,680px)] bg-concrete-dark/20">
                  <PortraitSilhouette />
                </ImageFrame>
              </GsapReveal>
            </div>
          </div>
        </PageContainer>
      </section>

      <ThresholdDoorway label="ROOM 01 — PHILOSOPHY" />

      <Section id="philosophy" rhythm="atrium" contained={false}>
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-1">
              <span className="dim-label">01</span>
            </div>
            <GsapReveal type="heading" className="lg:col-span-7">
              <blockquote>
                <p className="type-display leading-snug mb-6">
                  Architecture is the thoughtful making of space. We teach
                  proportion, material honesty, and the discipline of the grid.
                </p>
                <footer className="eyebrow text-clay">
                  — {BRAND.professor}
                </footer>
              </blockquote>
            </GsapReveal>
            <div className="room-void lg:col-span-4" aria-hidden="true" />
          </div>
        </PageContainer>
      </Section>

      <ThresholdDoorway label="ROOM 02 — PORTFOLIO" />

      <Section id="portfolio" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room="02"
            eyebrow="Work"
            title="Portfolio"
            href="/portfolio"
            linkLabel="All projects"
          />

          <ThresholdFrame label="Drawing set A — Featured">
            <GsapStagger className="bay-grid pt-6">
              {featuredProjects.map((project) => (
                <div
                  key={project.id}
                  className="col-span-12 md:col-span-4 bg-concrete"
                >
                  <ProjectCard
                    title={project.title}
                    category={project.category}
                    year={project.year}
                    image={project.image}
                    sheetRef={project.sheetRef}
                    href={`/portfolio/${project.slug}`}
                  />
                </div>
              ))}
            </GsapStagger>
          </ThresholdFrame>
        </PageContainer>
      </Section>

      <ThresholdDoorway label="ROOM 03 — COURSES" />

      <Section id="courses" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room="03"
            eyebrow="Education"
            title="Courses"
            href="/courses"
            linkLabel="Full curriculum"
          />

          <ThresholdFrame label="Programme index">
            <GsapStagger className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline mt-6">
              {courseGroups.map((group) => (
                <div
                  key={group.title}
                  className="bg-concrete p-6 lg:p-8 flex flex-col elevation-surface"
                >
                  <p className="eyebrow mb-2">{group.subtitle}</p>
                  <h3 className="type-title mb-3">{group.title}</h3>
                  <p className="type-infill leading-relaxed mb-6 flex-1">
                    {group.courses[0]?.description}
                  </p>
                  <div className="hairline-t pt-6 space-y-4">
                    <span className="label-caps">
                      {group.courses.length} courses
                    </span>
                    {group.type === "leveled" && (
                      <LevelProgressLine progress={1} className="max-w-[100px]" />
                    )}
                    {group.bundlePrice ? (
                      <p className="type-display text-clay">{group.bundlePrice}</p>
                    ) : (
                      <p className="type-infill">From {group.courses[0]?.price}</p>
                    )}
                    <Link href="/courses" className="action-secondary">
                      View syllabus
                    </Link>
                  </div>
                </div>
              ))}
            </GsapStagger>
          </ThresholdFrame>
        </PageContainer>
      </Section>

      <ThresholdDoorway label="ROOM 04 — PRODUCTS" />

      <Section id="products" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room="04"
            eyebrow="Studio shop"
            title="Products"
            href="/products"
            linkLabel="Full catalogue"
          />

          <ThresholdFrame label="Stock list — Featured">
            <GsapStagger className="bay-grid pt-6">
              {featuredProducts.map((product) => (
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

      <ThresholdDoorway label="ROOM 05 — RESEARCH" />

      <Section id="researches" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room="05"
            eyebrow="Scholarship"
            title="Research"
            href="/researches"
            linkLabel="All publications"
          />

          <ThresholdFrame label="Bibliography — Recent">
            <div className="mt-6 max-w-3xl">
              {featuredResearches.map((item, i) => (
                <GsapReveal key={item.id} type="card" delay={i * 0.055}>
                  <article className={`py-8 ${i > 0 ? "hairline-t" : ""}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
                      <div className="lg:col-span-3 flex gap-4 lg:flex-col lg:gap-2">
                        <span className="label-caps">{item.category}</span>
                        <span className="label-caps opacity-70">{item.year}</span>
                      </div>
                      <div className="lg:col-span-9">
                        <h3 className="type-title mb-2 leading-snug">
                          {item.title}
                        </h3>
                        <p className="label-caps mb-3 opacity-80">{item.venue}</p>
                        <p className="type-infill leading-relaxed line-clamp-2">
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

      <ThresholdDoorway label="ROOM 06 — CONTACT" />

      <Section id="contact" rhythm="standard" contained={false}>
        <PageContainer>
          <SectionHeader
            room="06"
            eyebrow="Correspondence"
            title="Contact"
            href="/contact"
            linkLabel="Send a message"
          />

          <GsapReveal type="card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-hairline">
              <div className="bg-concrete p-6 sm:p-8 lg:p-10 lg:col-span-7 elevation-surface">
                <p className="type-infill leading-relaxed max-w-lg mb-8">
                  Write for commissions, collaboration, studio visits, or course
                  enrollment in Cairo.
                </p>
                <Link href="/contact" className="cta-entrance">
                  Open contact form
                </Link>
              </div>

              <div className="bg-concrete-dark/40 p-6 sm:p-8 lg:p-10 lg:col-span-5">
                <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
                <dl className="space-y-6">
                  <div>
                    <dt className="label-caps mb-2">Email</dt>
                    <dd className="type-infill">{BRAND.email}</dd>
                  </div>
                  <div>
                    <dt className="label-caps mb-2">Telephone</dt>
                    <dd className="type-infill">{BRAND.phone}</dd>
                  </div>
                  <div>
                    <dt className="label-caps mb-2">Studio</dt>
                    <dd className="type-infill leading-relaxed">
                      {BRAND.address.line1}
                      <br />
                      {BRAND.address.line2}, {BRAND.address.country}
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

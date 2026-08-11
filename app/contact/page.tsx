"use client";

import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { SocialLinks } from "@/components/SocialLinks";

function ArrowUpRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
    >
      <path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function Pin() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
    >
      <path
        d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export default function ContactPage() {
  const { branding, settings } = useSiteSettings();
  const intro = settings.contactPage?.intro;
  const phoneHref = `tel:${branding.phone.replace(/[^\d+]/g, "")}`;
  const mobile = branding.mobile ?? branding.phone;
  const mobileHref = `tel:${mobile.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <CmsPageHeader pageKey="contact" />

      <ThresholdDoorway label="STUDIO CORRESPONDENCE / 06" />

      <section className="border-b border-hairline">
        <PageContainer>
          <div className="grid min-h-[30rem] grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col justify-between border-hairline px-2 py-10 sm:px-4 sm:py-14 lg:col-span-8 lg:border-r lg:px-8 lg:py-20">
              <Reveal variant="structural">
                <div>
                  <p className="eyebrow mb-8 text-clay">Start a conversation</p>
                  <h1 className="max-w-4xl font-serif text-[clamp(3.25rem,8vw,7.5rem)] font-light leading-[0.86] tracking-[-0.055em] text-charcoal">
                    Let&apos;s shape
                    <br />
                    <span className="italic text-clay">what comes next.</span>
                  </h1>
                </div>
              </Reveal>

              <Reveal variant="infill" delay={100}>
                <p className="mt-14 max-w-xl text-base leading-relaxed text-charcoal-muted sm:text-lg lg:ml-auto lg:mt-20">
                  {intro ||
                    "Tell us about the question, project, or collaboration you have in mind. We’ll respond with a clear next step."}
                </p>
              </Reveal>
            </div>

            <div className="flex flex-col bg-charcoal text-concrete lg:col-span-4">
              <div className="flex min-h-48 flex-1 flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <span className="label-caps !text-concrete/50">Direct line</span>
                  <span className="font-serif text-5xl font-light text-clay">06</span>
                </div>
                <div className="mt-12 space-y-3">
                  <a
                    href={`mailto:${branding.email}`}
                    className="group flex items-center justify-between border-b border-concrete/20 pb-3 font-serif text-xl text-concrete transition-colors hover:text-clay sm:text-2xl"
                  >
                    <span className="min-w-0 truncate">{branding.email}</span>
                    <ArrowUpRight />
                  </a>
                  <a
                    href={phoneHref}
                    className="group flex items-center justify-between border-b border-concrete/20 pb-3 font-serif text-xl text-concrete transition-colors hover:text-clay sm:text-2xl"
                  >
                    <span>{branding.phone}</span>
                    <ArrowUpRight />
                  </a>
                  <SocialLinks branding={branding} tone="on-dark" className="pt-2" />
                </div>
              </div>
              <div className="border-t border-concrete/20 p-6 sm:p-8 lg:p-10">
                <p className="label-caps mb-3 !text-concrete/50">Response window</p>
                <p className="text-sm leading-relaxed text-concrete/75">
                  Messages are reviewed during studio hours. Expect a personal
                  response within two working days.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="section-standard">
        <PageContainer>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
            <div className="lg:col-span-4 lg:pr-12">
              <Reveal variant="structural">
                <div className="lg:sticky lg:top-28">
                  <p className="eyebrow mb-5 text-clay">Project brief</p>
                  <h2 className="type-display max-w-sm">
                    Tell us where you want to begin.
                  </h2>
                  <p className="type-body mt-6 max-w-sm">
                    Share the essentials below. A concise outline is enough—we
                    can develop the details together.
                  </p>
                  <div className="mt-10 hidden items-center gap-3 text-clay lg:flex">
                    <span className="block h-px w-12 bg-clay" />
                    <span className="label-caps text-clay">Required fields *</span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-8 lg:border-l lg:border-hairline lg:pl-12 xl:pl-16">
              <Reveal variant="infill" delay={150}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-hairline bg-concrete-dark/60">
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-3">
            <Reveal variant="infill">
              <div className="min-h-64 p-6 sm:p-8 lg:p-10">
                <Pin />
                <p className="eyebrow mb-5 mt-12 text-clay">Visit the studio</p>
                <address className="font-serif text-xl not-italic leading-snug text-charcoal">
                  {branding.address.line1}
                  <br />
                  {branding.address.line2}
                  <br />
                  {branding.address.governorate}, {branding.address.country}
                </address>
              </div>
            </Reveal>

            <Reveal variant="infill" delay={75}>
              <div className="min-h-64 border-hairline p-6 sm:p-8 md:border-l lg:p-10">
                <p className="label-caps text-charcoal-infill">Studio hours</p>
                <p className="mt-16 whitespace-pre-line font-serif text-xl leading-snug text-charcoal">
                  {branding.officeHours}
                </p>
              </div>
            </Reveal>

            <Reveal variant="infill" delay={150}>
              <div className="min-h-64 border-hairline p-6 sm:p-8 md:border-l lg:p-10">
                <p className="label-caps text-charcoal-infill">Other channels</p>
                <div className="mt-14 space-y-4">
                  <a
                    href={mobileHref}
                    className="flex items-center justify-between border-b border-hairline pb-3 text-sm text-charcoal transition-colors hover:text-clay"
                  >
                    <span>{mobile}</span>
                    <ArrowUpRight />
                  </a>
                  <a
                    href={`mailto:${branding.email}`}
                    className="flex items-center justify-between border-b border-hairline pb-3 text-sm text-charcoal transition-colors hover:text-clay"
                  >
                    <span className="min-w-0 truncate">{branding.email}</span>
                    <ArrowUpRight />
                  </a>
                  <SocialLinks branding={branding} variant="rows" />
                </div>
              </div>
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

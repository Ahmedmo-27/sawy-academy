"use client";

import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

const LAST_UPDATED = "25 August 2026";

const SECTIONS = [
  { id: "agreement", number: "01", title: "Agreement to terms" },
  { id: "accounts-devices", number: "02", title: "Accounts & device registration" },
  { id: "intellectual-property", number: "03", title: "Intellectual property & video security" },
  { id: "course-access", number: "04", title: "Enrollment & access grants" },
  { id: "student-conduct", number: "05", title: "Student code & conduct" },
  { id: "studio-services", number: "06", title: "Design & research services" },
  { id: "liability", number: "07", title: "Limitation of liability" },
  { id: "termination", number: "08", title: "Suspension & termination" },
  { id: "governing-law", number: "09", title: "Governing law & jurisdiction" },
  { id: "contact", number: "10", title: "Contact & notices" },
] as const;

function PolicySection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 space-y-4">
      <div className="flex items-baseline gap-3 border-b border-hairline pb-2">
        <span className="label-caps text-clay">{number}</span>
        <h3 className="font-serif text-2xl font-light text-charcoal">{title}</h3>
      </div>
      <div className="space-y-4 font-serif text-base leading-relaxed text-charcoal/90 sm:text-lg">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const { branding } = useSiteSettings();
  const address = [
    branding.address.line1,
    branding.address.line2,
    branding.address.governorate,
    branding.address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <header className="relative overflow-hidden border-b border-hairline pt-24 pb-12 sm:pt-28 sm:pb-16">
        <PageContainer>
          <p className="eyebrow mb-3 text-clay">Studio governance</p>
          <h1 className="type-heading max-w-4xl">Terms of Service</h1>
          <p className="type-lead mt-4 max-w-2xl text-charcoal-muted">
            The rules, rights, and responsibilities governing student enrollment,
            educational content, and studio engagement.
          </p>
        </PageContainer>
      </header>

      <ThresholdDoorway label="TERMS OF SERVICE / 00" />

      <section className="border-b border-hairline">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="border-hairline px-2 py-10 sm:px-4 sm:py-14 lg:col-span-8 lg:border-r lg:px-8 lg:py-20">
              <Reveal variant="structural">
                <p className="eyebrow mb-8 text-clay">Studio agreement</p>
                <h2 className="max-w-3xl font-serif text-[clamp(2.25rem,5vw,4.25rem)] font-light leading-[0.92] tracking-[-0.04em] text-charcoal">
                  Standards of practice
                  <br />
                  <span className="italic text-clay">& academic integrity.</span>
                </h2>
              </Reveal>
              <Reveal variant="infill" delay={100}>
                <p className="type-body mt-10 max-w-xl">
                  By accessing {branding.name}, creating a student account, or
                  enrolling in our architectural courses, you agree to comply with
                  these Terms of Service.
                </p>
              </Reveal>
            </div>

            <div className="flex flex-col justify-between bg-charcoal px-6 py-10 text-concrete sm:p-8 lg:col-span-4 lg:p-10">
              <div className="flex items-start justify-between">
                <span className="label-caps !text-concrete/50">Sheet date</span>
                <span className="font-serif text-5xl font-light text-clay">00</span>
              </div>
              <div className="mt-16">
                <p className="label-caps mb-3 !text-concrete/50">Last revised</p>
                <p className="font-serif text-2xl font-light text-concrete">
                  {LAST_UPDATED}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-concrete/70">
                  Operated by {branding.professorTitle} and {branding.name}, Cairo,
                  Egypt.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="section-standard">
        <PageContainer>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
            <aside className="lg:col-span-4 lg:pr-12">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow mb-5 text-clay">Contents</p>
                <nav aria-label="Terms of service sections">
                  <ol className="space-y-3">
                    {SECTIONS.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="group flex items-baseline gap-3 text-sm text-charcoal-muted transition-colors hover:text-charcoal"
                        >
                          <span className="label-caps text-clay">
                            {section.number}
                          </span>
                          <span className="border-b border-transparent group-hover:border-hairline">
                            {section.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>

            <div className="lg:col-span-8 lg:border-l lg:border-hairline lg:pl-12 xl:pl-16">
              <ThresholdFrame label="Terms title block">
                <article className="space-y-16 p-1 sm:p-4">
                  <PolicySection
                    id="agreement"
                    number="01"
                    title="Agreement to terms"
                  >
                    <p>
                      These Terms of Service constitute a legally binding agreement
                      between you and {branding.name} (&quot;we,&quot; &quot;us,&quot; or
                      &quot;the studio&quot;), founded and directed by{" "}
                      {branding.professorTitle}.
                    </p>
                    <p>
                      If you do not agree with any part of these terms, you must not
                      use the platform or enroll in any courses.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="accounts-devices"
                    number="02"
                    title="Accounts & device registration"
                  >
                    <p>
                      To enroll in courses and access lesson recordings, you must
                      register for a student account.
                    </p>
                    <ul>
                      <li>
                        You are responsible for maintaining the confidentiality of
                        your credentials.
                      </li>
                      <li>
                        <strong>Device Limit:</strong> Each account is bound to a
                        maximum of two (2) registered devices. Device binding is
                        enforced at login. Sharing credentials or attempting to bypass
                        device limits may lead to immediate suspension.
                      </li>
                      <li>
                        If you replace a device, you may request a device slot
                        replacement through your student profile or contact the
                        studio administrator.
                      </li>
                    </ul>
                  </PolicySection>

                  <PolicySection
                    id="intellectual-property"
                    number="03"
                    title="Intellectual property & video security"
                  >
                    <p>
                      All course videos, adaptive streams, architectural drawings,
                      PDF specification sheets, curriculum designs, research papers,
                      and portfolio materials are the exclusive intellectual property
                      of {branding.professorTitle} and {branding.name}.
                    </p>
                    <ul>
                      <li>
                        <strong>Limited License:</strong> Enrolled students are granted
                        a non-exclusive, non-transferable, revocable license to view
                        video lectures and download PDF lesson sheets solely for
                        personal academic study.
                      </li>
                      <li>
                        <strong>Prohibition of Redistribution:</strong> You strictly
                        agree not to record, screen-capture, rip, download raw video
                        segments, reverse engineer, re-upload, distribute, or publicly
                        screen any studio lectures or course assets.
                      </li>
                      <li>
                        <strong>Dynamic Watermarking:</strong> All video streams
                        contain dynamic, user-identifying watermarks. In the event of
                        unauthorized leak or capture, forensic watermarking will be used
                        to trace the originating account, resulting in immediate
                        permanent revocation and legal liability.
                      </li>
                    </ul>
                  </PolicySection>

                  <PolicySection
                    id="course-access"
                    number="04"
                    title="Enrollment & access grants"
                  >
                    <p>
                      Course enrollment is settled via manual payment methods
                      (including InstaPay in Egypt).
                    </p>
                    <p>
                      Access to course videos and materials is activated upon studio
                      verification of the submitted payment screenshot (typically
                      within 1–2 business days). For leveled tracks, progression to
                      subsequent levels requires completing the prerequisite level
                      lessons.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="student-conduct"
                    number="05"
                    title="Student code & conduct"
                  >
                    <p>
                      Students are expected to maintain professional and ethical
                      standards. Plagiarism of studio drawing sheets, abuse of the
                      platform infrastructure, harassment of instructors or peers, or
                      unauthorized sharing of account access constitutes grounds for
                      immediate account termination without refund.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="studio-services"
                    number="06"
                    title="Design & research services"
                  >
                    <p>
                      Requests submitted through the Services page (architectural
                      design commissions, research collaborations) are exploratory
                      inquiries and do not constitute a binding contract until a
                      formal written engagement proposal is signed by both parties.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="liability"
                    number="07"
                    title="Limitation of liability"
                  >
                    <p>
                      The educational platform, content, and services are provided on
                      an &quot;as is&quot; and &quot;as available&quot; basis. To the
                      maximum extent permitted by applicable law, {branding.name} and
                      its instructors shall not be liable for any indirect, incidental,
                      or consequential damages arising from your use of the platform.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="termination"
                    number="08"
                    title="Suspension & termination"
                  >
                    <p>
                      We reserve the right to suspend or terminate your account and
                      access to course materials at our discretion if you violate
                      these Terms of Service, fail verification, or compromise
                      intellectual property security.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="governing-law"
                    number="09"
                    title="Governing law & jurisdiction"
                  >
                    <p>
                      These Terms are governed by and construed in accordance with the
                      laws of the Arab Republic of Egypt. Any dispute arising out of or
                      relating to these terms shall be subject to the exclusive
                      jurisdiction of the courts of Cairo, Egypt.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="contact"
                    number="10"
                    title="Contact & notices"
                  >
                    <p>
                      For legal notices or questions regarding these terms, please
                      reach out to the studio:
                    </p>
                    <p>
                      <strong>{branding.name}</strong>
                      <br />
                      {address || "Zamalek, Cairo, Egypt"}
                      <br />
                      Email:{" "}
                      <a
                        href={`mailto:${branding.email}`}
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        {branding.email}
                      </a>
                    </p>
                  </PolicySection>
                </article>
              </ThresholdFrame>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

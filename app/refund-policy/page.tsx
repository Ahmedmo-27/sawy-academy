"use client";

import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

const LAST_UPDATED = "25 August 2026";

const SECTIONS = [
  { id: "overview", number: "01", title: "Policy overview" },
  { id: "verification", number: "02", title: "Payment verification & rejections" },
  { id: "digital-courses", number: "03", title: "Digital course access & refunds" },
  { id: "physical-products", number: "04", title: "Physical products & studio pickup" },
  { id: "duplicate-payments", number: "05", title: "Overpayments & duplicate transfers" },
  { id: "how-to-request", number: "06", title: "How to request assistance" },
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

export default function RefundPolicyPage() {
  const { branding } = useSiteSettings();

  return (
    <>
      <header className="relative overflow-hidden border-b border-hairline pt-24 pb-12 sm:pt-28 sm:pb-16">
        <PageContainer>
          <p className="eyebrow mb-3 text-clay">Settlement & cancellation</p>
          <h1 className="type-heading max-w-4xl">Refund Policy</h1>
          <p className="type-lead mt-4 max-w-2xl text-charcoal-muted">
            Terms governing manual payment settlements, digital course access, and
            refund eligibility at Sawy Academy.
          </p>
        </PageContainer>
      </header>

      <ThresholdDoorway label="REFUND POLICY / 00" />

      <section className="border-b border-hairline">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="border-hairline px-2 py-10 sm:px-4 sm:py-14 lg:col-span-8 lg:border-r lg:px-8 lg:py-20">
              <Reveal variant="structural">
                <p className="eyebrow mb-8 text-clay">Studio notice</p>
                <h2 className="max-w-3xl font-serif text-[clamp(2.25rem,5vw,4.25rem)] font-light leading-[0.92] tracking-[-0.04em] text-charcoal">
                  Clarity in settlement
                  <br />
                  <span className="italic text-clay">& digital delivery.</span>
                </h2>
              </Reveal>
              <Reveal variant="infill" delay={100}>
                <p className="type-body mt-10 max-w-xl">
                  Because Sawy Academy courses deliver immediate, unrestricted
                  access to proprietary architectural curricula and protected
                  video lectures, please review our refund conditions before
                  completing your transfer.
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
                  Applies to all order transactions settled with Sawy Academy in
                  Cairo, Egypt.
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
                <nav aria-label="Refund policy sections">
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
              <ThresholdFrame label="Refund title block">
                <article className="space-y-16 p-1 sm:p-4">
                  <PolicySection
                    id="overview"
                    number="01"
                    title="Policy overview"
                  >
                    <p>
                      At {branding.name}, orders are processed through direct manual
                      transfers (InstaPay). Payment verification is performed by our
                      administrative team before activating enrollments or reserving
                      studio materials.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="verification"
                    number="02"
                    title="Payment verification & rejections"
                  >
                    <p>
                      When you submit an order, you provide a screenshot of the
                      transfer.
                    </p>
                    <ul>
                      <li>
                        <strong>Unverified Orders:</strong> If an order is rejected due
                        to an unreadable receipt, mismatched amount, or missing
                        transfer reference, the reason is recorded in your dashboard
                        and emailed to you. No funds will have been claimed, and you
                        may submit a corrected receipt without penalty.
                      </li>
                      <li>
                        <strong>Verification Window:</strong> Verification typically
                        takes 1–2 business days. If you wish to cancel an order before
                        it has been verified by the studio, you may contact us
                        immediately to void the submission.
                      </li>
                    </ul>
                  </PolicySection>

                  <PolicySection
                    id="digital-courses"
                    number="03"
                    title="Digital course access & refunds"
                  >
                    <p>
                      Due to the nature of digital intellectual property and
                      immediate accessibility of lecture videos, architectural
                      drawings, and course PDF sheets:
                    </p>
                    <ul>
                      <li>
                        <strong>Activated Enrollments:</strong> Once an order is
                        verified and course access is unlocked on your account, course
                        fees are non-refundable.
                      </li>
                      <li>
                        <strong>Technical Issues:</strong> If you experience persistent
                        technical difficulty streaming videos or accessing sheets, our
                        technical team will provide dedicated support to resolve the
                        issue. Technical issues do not warrant a cash refund unless the
                        studio is unable to provide the purchased access within a
                        reasonable timeframe.
                      </li>
                    </ul>
                  </PolicySection>

                  <PolicySection
                    id="physical-products"
                    number="04"
                    title="Physical products & studio pickup"
                  >
                    <p>
                      Studio products (specialized architectural instruments, reference
                      compilations, printed drawings) are fulfilled directly through
                      in-studio purchase or scheduled pickup at our Zamalek studio.
                    </p>
                    <p>
                      Products may be inspected upon collection. If an item is found
                      defective or damaged prior to pickup, an immediate exchange or
                      refund will be processed at the studio desk.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="duplicate-payments"
                    number="05"
                    title="Overpayments & duplicate transfers"
                  >
                    <p>
                      In the event of an inadvertent duplicate transfer or
                      overpayment via InstaPay, contact the studio administration with
                      the bank transaction references. Once confirmed against our
                      records, excess amounts will be returned via InstaPay transfer to
                      the originating account within 3–5 business days.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="how-to-request"
                    number="06"
                    title="How to request assistance"
                  >
                    <p>
                      For any questions regarding an order, payment receipt, or
                      cancellation request, please contact:
                    </p>
                    <p>
                      <strong>{branding.name} — Order Desk</strong>
                      <br />
                      Email:{" "}
                      <a
                        href={`mailto:${branding.email}`}
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        {branding.email}
                      </a>
                      <br />
                      Phone: {branding.phone}
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

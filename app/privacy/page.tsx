"use client";

import Link from "next/link";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

const LAST_UPDATED = "11 August 2026";

const SECTIONS = [
  { id: "who-we-are", number: "01", title: "Who we are" },
  { id: "information-we-collect", number: "02", title: "Information we collect" },
  { id: "how-we-use", number: "03", title: "How we use information" },
  { id: "cookies", number: "04", title: "Cookies & local storage" },
  { id: "payments", number: "05", title: "Orders & payments" },
  { id: "devices", number: "06", title: "Devices & lesson access" },
  { id: "sharing", number: "07", title: "Sharing & processors" },
  { id: "retention", number: "08", title: "Retention" },
  { id: "security", number: "09", title: "Security" },
  { id: "your-rights", number: "10", title: "Your rights" },
  { id: "children", number: "11", title: "Children" },
  { id: "changes", number: "12", title: "Changes" },
  { id: "contact", number: "13", title: "Contact" },
] as const;

export default function PrivacyPage() {
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
      <CmsPageHeader pageKey="privacy" />

      <ThresholdDoorway label="PRIVACY POLICY / 00" />

      <section className="border-b border-hairline">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="border-hairline px-2 py-10 sm:px-4 sm:py-14 lg:col-span-8 lg:border-r lg:px-8 lg:py-20">
              <Reveal variant="structural">
                <p className="eyebrow mb-8 text-clay">Studio notice</p>
                <h2 className="max-w-3xl font-serif text-[clamp(2.25rem,5vw,4.25rem)] font-light leading-[0.92] tracking-[-0.04em] text-charcoal">
                  How this academy
                  <br />
                  <span className="italic text-clay">holds your data.</span>
                </h2>
              </Reveal>
              <Reveal variant="infill" delay={100}>
                <p className="type-body mt-10 max-w-xl">
                  This policy explains what {branding.name} collects when you
                  browse the studio, create an account, enroll in a course,
                  place an order, or write to us — and how that information is
                  used, stored, and shared.
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
                  Applies to sawyacademy.eg and related studio services operated
                  from Cairo, Egypt.
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
                <nav aria-label="Privacy policy sections">
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
              <ThresholdFrame label="Policy title block">
                <article className="space-y-16 p-1 sm:p-4">
                  <PolicySection id="who-we-are" number="01" title="Who we are">
                    <p>
                      {branding.name} is the architecture studio and teaching
                      practice of {branding.professorTitle}. We publish
                      portfolio work, research, courses, products, and
                      professional services from {address || "Cairo, Egypt"}.
                    </p>
                    <p>
                      For privacy questions, write to{" "}
                      <a
                        href={`mailto:${branding.email}`}
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        {branding.email}
                      </a>
                      .
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="information-we-collect"
                    number="02"
                    title="Information we collect"
                  >
                    <p>We collect only what is needed to run the academy:</p>
                    <ul>
                      <li>
                        <strong>Account details</strong> — name, email address,
                        and a hashed password when you create a student or
                        studio account.
                      </li>
                      <li>
                        <strong>Correspondence</strong> — name, email, subject,
                        and message from the contact form, plus any files you
                        attach to a service request.
                      </li>
                      <li>
                        <strong>Orders</strong> — the items you purchase,
                        quantities, amounts, and the InstaPay payment screenshot
                        you upload for studio verification.
                      </li>
                      <li>
                        <strong>Learning activity</strong> — course enrollment
                        and lesson progress so you can resume where you left
                        off.
                      </li>
                      <li>
                        <strong>Technical data</strong> — a device identifier,
                        browser session, and limited access logs when you sign
                        in or stream protected lesson video. We do not sell
                        advertising profiles.
                      </li>
                    </ul>
                  </PolicySection>

                  <PolicySection
                    id="how-we-use"
                    number="03"
                    title="How we use information"
                  >
                    <p>We use personal information to:</p>
                    <ul>
                      <li>Create and maintain your account</li>
                      <li>Enroll you in courses and deliver lesson materials</li>
                      <li>Verify payments and fulfill product or course orders</li>
                      <li>Respond to inquiries and service briefs</li>
                      <li>
                        Protect lesson video and documents from unauthorized
                        sharing
                      </li>
                      <li>Keep the site secure and diagnose technical issues</li>
                    </ul>
                    <p>
                      We do not use your information for third-party advertising
                      or sell it to data brokers.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="cookies"
                    number="04"
                    title="Cookies & local storage"
                  >
                    <p>
                      Sign-in uses an httpOnly session cookie so we can keep you
                      authenticated without storing tokens in the browser. A
                      device identifier is also stored (cookie and local
                      storage) so lesson access can be limited to the devices
                      you register.
                    </p>
                    <p>
                      Your cart is saved in local storage on this device until
                      you submit an order or clear it. These are essential
                      studio functions, not marketing trackers. You can clear
                      cookies and local storage in your browser; doing so will
                      sign you out and empty the local cart.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="payments"
                    number="05"
                    title="Orders & payments"
                  >
                    <p>
                      Checkout is settled by InstaPay. You upload a payment
                      screenshot; the studio reviews it before releasing the
                      order. We do not collect or store bank-card numbers, PIN
                      codes, or InstaPay login credentials.
                    </p>
                    <p>
                      The screenshot and order record are kept so we can confirm
                      payment, resolve disputes, and maintain purchase history
                      in your account.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="devices"
                    number="06"
                    title="Devices & lesson access"
                  >
                    <p>
                      Protected lessons are streamed only to signed-in students
                      on registered devices. We record device identifiers and
                      access events so we can enforce device limits, revoke a
                      lost device, and investigate abuse of course video or
                      documents.
                    </p>
                    <p>
                      You can review and remove devices from your account. The
                      studio may revoke sessions if access rules are broken.
                    </p>
                  </PolicySection>

                  <PolicySection
                    id="sharing"
                    number="07"
                    title="Sharing & processors"
                  >
                    <p>
                      We share information only with service providers that help
                      us operate the site — for example hosting, database
                      storage, and file storage for images, payment proofs, and
                      lesson media. Those providers process data on our
                      instructions and are not permitted to use it for their own
                      marketing.
                    </p>
                    <p>
                      We may disclose information if required by Egyptian law or
                      to protect the studio, students, or the integrity of
                      course materials.
                    </p>
                  </PolicySection>

                  <PolicySection id="retention" number="08" title="Retention">
                    <p>
                      Account, enrollment, and order records are kept for as
                      long as your account is active and for a reasonable period
                      afterward to fulfill purchases, answer support requests,
                      and meet legal or accounting needs. Payment screenshots
                      and access logs are retained only as long as they remain
                      useful for verification and security.
                    </p>
                    <p>
                      Contact messages and service briefs are kept while we
                      handle the inquiry and for a limited archive thereafter.
                    </p>
                  </PolicySection>

                  <PolicySection id="security" number="09" title="Security">
                    <p>
                      Passwords are stored as one-way hashes. Lesson video and
                      documents live in private storage and are authorized per
                      session. No method of transmission or storage is perfectly
                      secure; we take proportionate measures and ask you to use
                      a strong, unique password.
                    </p>
                  </PolicySection>

                  <PolicySection id="your-rights" number="10" title="Your rights">
                    <p>
                      Subject to Egyptian personal-data law and any applicable
                      rights where you live, you may ask us to:
                    </p>
                    <ul>
                      <li>Confirm what personal information we hold</li>
                      <li>Correct inaccurate details</li>
                      <li>Delete your account where we no longer need it</li>
                      <li>Restrict or object to certain processing</li>
                    </ul>
                    <p>
                      You can update your profile and password while signed in.
                      For access or deletion requests, email{" "}
                      <a
                        href={`mailto:${branding.email}`}
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        {branding.email}
                      </a>
                      . We may need to verify that the request comes from the
                      account holder. Some records (for example completed
                      orders) may be retained where the law requires it.
                    </p>
                  </PolicySection>

                  <PolicySection id="children" number="11" title="Children">
                    <p>
                      The academy is intended for students and professionals who
                      can form an account. We do not knowingly collect personal
                      information from children under 13. If you believe a child
                      has provided data, contact us and we will delete it.
                    </p>
                  </PolicySection>

                  <PolicySection id="changes" number="12" title="Changes">
                    <p>
                      If this policy changes in a material way, we will update
                      the date on this page. Continued use of the site after a
                      revision means you accept the updated notice, except where
                      the law requires a different form of consent.
                    </p>
                  </PolicySection>

                  <PolicySection id="contact" number="13" title="Contact">
                    <p>
                      {branding.name}
                      <br />
                      {branding.professorTitle}
                      <br />
                      {address}
                    </p>
                    <p>
                      Email:{" "}
                      <a
                        href={`mailto:${branding.email}`}
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        {branding.email}
                      </a>
                      {branding.phone ? (
                        <>
                          <br />
                          Studio: {branding.phone}
                        </>
                      ) : null}
                    </p>
                    <p>
                      Prefer a project brief instead?{" "}
                      <Link
                        href="/contact"
                        className="text-charcoal underline decoration-hairline underline-offset-4 hover:text-clay"
                      >
                        Write through the contact page
                      </Link>
                      .
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
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
        <h2 className="type-title">{title}</h2>
        <span className="label-caps text-clay">{number}</span>
      </div>
      <div className="space-y-4 [&_li]:mt-2 [&_strong]:font-medium [&_strong]:text-charcoal [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_p]:type-body [&_li]:type-body">
        {children}
      </div>
    </section>
  );
}

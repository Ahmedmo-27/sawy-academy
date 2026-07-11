import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { BRAND } from "@/lib/branding";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inquiry"
        title="Contact"
        description="For commissions, academic collaboration, or studio visits in Cairo."
      />

      <ThresholdDoorway label="INQUIRY THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline">
            <div className="bg-concrete p-6 sm:p-8 lg:p-12 lg:pr-16">
              <ThresholdFrame label="Bay 06 — Correspondence">
                <Reveal variant="structural">
                  <p className="type-infill mb-10 max-w-md leading-relaxed">
                    Whether you are seeking design consultation, research
                    partnership, or wish to discuss enrollment at {BRAND.name}
                    — I welcome thoughtful correspondence.
                  </p>
                </Reveal>

                <Reveal variant="infill" delay={100}>
                  <ContactForm />
                </Reveal>
              </ThresholdFrame>
            </div>

            <div className="surface-infill p-6 sm:p-8 lg:p-12">
              <Reveal variant="infill" delay={150}>
                <ThresholdFrame label="Drawing Title Block">
                  <div className="hairline-border p-5 sm:p-8 mt-4 bg-concrete/80">
                    <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
                    <div className="hairline-b pb-6 mb-6">
                      <p className="label-caps mb-2">Project</p>
                      <p className="type-title">{BRAND.name}</p>
                    </div>

                    <div className="hairline-b py-6 mb-6">
                      <p className="label-caps mb-2">Architect</p>
                      <p className="type-title text-xl">{BRAND.professor}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 hairline-b py-6 mb-6">
                      <div>
                        <p className="label-caps mb-2">Scale</p>
                        <p className="type-infill">1:100</p>
                      </div>
                      <div>
                        <p className="label-caps mb-2">Date</p>
                        <p className="type-infill">{BRAND.established}</p>
                      </div>
                    </div>

                    <div className="hairline-b py-6 mb-6">
                      <p className="label-caps mb-2">Location</p>
                      <address className="type-infill not-italic leading-relaxed">
                        {BRAND.address.line1}
                        <br />
                        {BRAND.address.line2}
                        <br />
                        {BRAND.address.governorate}
                        <br />
                        {BRAND.address.country}
                        <br />
                        {BRAND.address.postal}
                      </address>
                    </div>

                    <div className="space-y-4 hairline-b py-6 mb-6">
                      <div>
                        <p className="label-caps mb-2">Telephone</p>
                        <p className="type-infill">{BRAND.phone}</p>
                        <p className="type-infill mt-1">{BRAND.mobile}</p>
                      </div>
                      <div>
                        <p className="label-caps mb-2">Email</p>
                        <p className="type-infill">{BRAND.email}</p>
                      </div>
                      <div>
                        <p className="label-caps mb-2">Office Hours</p>
                        <p className="type-infill whitespace-pre-line">
                          {BRAND.officeHours}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-2">
                      <p className="label-caps">Drawn by</p>
                      <p className="font-serif text-sm italic text-charcoal-infill">
                        M. El Sawy
                      </p>
                    </div>
                  </div>
                </ThresholdFrame>
              </Reveal>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

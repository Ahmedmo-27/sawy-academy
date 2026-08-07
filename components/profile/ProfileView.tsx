"use client";

import { Reveal } from "@/components/Reveal";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageHeader } from "@/components/PageHeader";
import { AccountActionsSection } from "@/components/profile/AccountActionsSection";
import { DevicesSection } from "@/components/profile/DevicesSection";
import { EnrolledCoursesSection } from "@/components/profile/EnrolledCoursesSection";
import { OrderHistorySection } from "@/components/profile/OrderHistorySection";
import { ProfileIdentityPanel } from "@/components/profile/ProfileIdentityPanel";
import { ProfileSheetNav } from "@/components/profile/ProfileSheetNav";
import { ServiceRequestsSection } from "@/components/profile/ServiceRequestsSection";

export function ProfileView() {
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Your sheet"
        description="Identity, drawing sets in progress, orders, and service briefs — one register for your student account."
      />

      <ThresholdDoorway label="STUDENT PROFILE" />

      <div className="sticky top-[var(--nav-height)] z-20 border-b border-hairline bg-concrete/95 nav-blur lg:hidden">
        <PageContainer className="py-0">
          <ProfileSheetNav orientation="horizontal" />
        </PageContainer>
      </div>

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-16">
            <aside className="hidden lg:block">
              <div className="sticky top-[calc(var(--nav-height)+2rem)]">
                <Reveal variant="infill">
                  <ProfileSheetNav />
                </Reveal>
              </div>
            </aside>

            <div className="min-w-0 space-y-14 sm:space-y-16">
              <Reveal variant="infill">
                <ProfileIdentityPanel />
              </Reveal>

              <SectionCutDivider label="ENROLLMENTS" />

              <Reveal variant="infill">
                <EnrolledCoursesSection />
              </Reveal>

              <SectionCutDivider label="ORDERS" />

              <Reveal variant="infill">
                <OrderHistorySection />
              </Reveal>

              <SectionCutDivider label="SERVICES" />

              <Reveal variant="infill">
                <ServiceRequestsSection />
              </Reveal>

              <SectionCutDivider label="DEVICES" />

              <Reveal variant="infill">
                <DevicesSection />
              </Reveal>

              <SectionCutDivider label="ACCOUNT" />

              <Reveal variant="infill">
                <AccountActionsSection />
              </Reveal>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

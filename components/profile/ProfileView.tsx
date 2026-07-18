"use client";

import { Reveal } from "@/components/Reveal";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageHeader } from "@/components/PageHeader";
import { AccountActionsSection } from "@/components/profile/AccountActionsSection";
import { EnrolledCoursesSection } from "@/components/profile/EnrolledCoursesSection";
import { OrderHistorySection } from "@/components/profile/OrderHistorySection";
import { ProfileIdentityPanel } from "@/components/profile/ProfileIdentityPanel";
import { ServiceRequestsSection } from "@/components/profile/ServiceRequestsSection";

export function ProfileView() {
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Profile"
        description="Identity, enrollments, orders, and service briefs for your student account."
      />

      <ThresholdDoorway label="STUDENT PROFILE" />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-16">
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

            <SectionCutDivider label="ACCOUNT" />

            <Reveal variant="infill">
              <AccountActionsSection />
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

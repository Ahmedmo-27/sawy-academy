import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Dashboard"
        description="Your current courses, account activity, requests, and registered devices at a glance."
      />

      <ThresholdDoorway label="STUDENT THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-6xl">
            <Reveal variant="infill">
              <StudentDashboard />
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

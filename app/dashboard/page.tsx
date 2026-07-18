import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { PageHeader } from "@/components/PageHeader";

/**
 * Student hub after login. Full profile, enrollments, and history live at
 * /dashboard/profile.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Dashboard"
        description="Your student register — open the profile sheet for enrollments, orders, and account settings."
      />

      <ThresholdDoorway label="STUDENT THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-lg">
            <Reveal variant="infill">
              <ThresholdFrame label="Student Register">
                <div className="hairline-border p-8 mt-4 bg-concrete/80">
                  <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
                  <p className="eyebrow text-clay mb-3">Profile sheet</p>
                  <p className="type-infill leading-relaxed">
                    Identity, course progress, order history, and service
                    requests are drawn on your profile sheet.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="cta-entrance mt-8 inline-flex"
                  >
                    Open profile
                  </Link>
                </div>
              </ThresholdFrame>
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

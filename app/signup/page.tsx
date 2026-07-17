import { Reveal } from "@/components/Reveal";
import { SignupForm } from "@/components/auth/SignupForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { PageHeader } from "@/components/PageHeader";

export default function SignupPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Sign Up"
        description="Create a student account to enroll, order materials, and follow studio work."
      />

      <ThresholdDoorway label="ENROLLMENT THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-md">
            <Reveal variant="infill">
              <ThresholdFrame label="Enrollment Sheet">
                <SignupForm />
              </ThresholdFrame>
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

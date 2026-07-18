import { Reveal } from "@/components/Reveal";
import { SignupForm } from "@/components/auth/SignupForm";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

export default function SignupPage() {
  return (
    <>
      <CmsPageHeader pageKey="signup" />

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

import { Reveal } from "@/components/Reveal";
import { LoginForm } from "@/components/auth/LoginForm";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

export default function LoginPage() {
  return (
    <>
      <CmsPageHeader pageKey="login" />

      <ThresholdDoorway label="ACCESS THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto max-w-md">
            <Reveal variant="infill">
              <ThresholdFrame label="Credential Sheet">
                <LoginForm />
              </ThresholdFrame>
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

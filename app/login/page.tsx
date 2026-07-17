import { Reveal } from "@/components/Reveal";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { PageHeader } from "@/components/PageHeader";

export default function LoginPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Login"
        description="Sign in to the studio register with your academy credentials."
      />

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

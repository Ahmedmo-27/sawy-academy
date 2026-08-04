import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

export default function CheckoutPage() {
  return (
    <>
      <CmsPageHeader pageKey="checkout" />

      <ThresholdDoorway label="PAYMENT THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <Reveal variant="infill">
            <ThresholdFrame label="Payment Title Block">
              <CheckoutForm />
            </ThresholdFrame>
          </Reveal>
        </PageContainer>
      </section>
    </>
  );
}

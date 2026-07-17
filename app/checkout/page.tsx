import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { PageHeader } from "@/components/PageHeader";

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settlement"
        title="Checkout"
        description="Confirm the order total and upload InstaPay proof for studio verification."
      />

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

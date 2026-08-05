import { Suspense } from "react";
import { OrderConfirmationView } from "@/components/cart/OrderConfirmationView";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function OrderConfirmationPage() {
  return (
    <>
      <CmsPageHeader pageKey="checkout" />

      <ThresholdDoorway label="PAYMENT THRESHOLD" />

      <section className="section-standard">
        <PageContainer>
          <Reveal variant="infill">
            <Suspense
              fallback={
                <p className="label-caps text-charcoal-muted loader-pulse">
                  Reading sheet
                </p>
              }
            >
              <OrderConfirmationView />
            </Suspense>
          </Reveal>
        </PageContainer>
      </section>
    </>
  );
}

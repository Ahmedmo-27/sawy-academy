import { CartView } from "@/components/cart/CartView";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageHeader } from "@/components/PageHeader";

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Studio Cart"
        title="Cart"
        description="Review line items before submitting payment for verification."
      />

      <ThresholdDoorway label="ORDER SHEET" />

      <section className="section-intimate">
        <PageContainer>
          <Reveal variant="infill">
            <CartView />
          </Reveal>
        </PageContainer>
      </section>
    </>
  );
}

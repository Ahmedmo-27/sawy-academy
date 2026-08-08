import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <CmsPageHeader pageKey="cart" />

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

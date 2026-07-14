import { PageHeader } from "@/components/PageHeader";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { products } from "@/lib/data/products";

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Studio Shop"
        title="All Products"
        description="Curated tools, software, and references recommended for architectural practice and study."
      />

      <ThresholdDoorway label="CATALOGUE" />

      <Section rhythm="atrium" contained={false}>
        <PageContainer>
          <ThresholdFrame label="Bay 05 — Product Grid">
            <GsapStagger className="bay-grid pt-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="col-span-full sm:col-span-1 lg:col-span-3 bg-concrete group"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    category={product.category}
                    description={product.description}
                    price={product.price}
                    image={product.image}
                  />
                </div>
              ))}
            </GsapStagger>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

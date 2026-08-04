"use client";

import { useEffect, useState } from "react";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { listProducts } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <CmsPageHeader pageKey="products" />

      <ThresholdDoorway label="CATALOGUE" />

      <Section rhythm="atrium" contained={false}>
        <PageContainer>
          <ThresholdFrame label="Bay 05 — Product Grid">
            {loading ? (
              <p className="type-body py-16">Loading products…</p>
            ) : (
              <GsapStagger className="bay-grid pt-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="col-span-12 sm:col-span-6 lg:col-span-3 bg-concrete group"
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
            )}
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

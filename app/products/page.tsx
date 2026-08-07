"use client";

import { useEffect, useState } from "react";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { apiGet } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Product[]>("/api/products", undefined, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
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

  const featured = products.slice(0, 4);

  return (
    <>
      <CmsPageHeader pageKey="products" />

      <ThresholdDoorway label="CATALOGUE" />

      {!loading && featured.length >= 3 && (
        <Section rhythm="intimate" contained={false}>
          <PageContainer>
            <ThresholdFrame label="Bay 05 — Featured tools">
              <div className="pt-6">
                <HorizontalPinGallery>
                  {featured.map((product) => (
                    <div
                      key={product.id}
                      className="w-[min(88vw,22rem)] shrink-0 bg-concrete sm:w-[min(42vw,24rem)]"
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
                </HorizontalPinGallery>
              </div>
            </ThresholdFrame>
          </PageContainer>
        </Section>
      )}

      <Section rhythm="atrium" contained={false}>
        <PageContainer>
          <ThresholdFrame label="Bay 05 — Product Grid">
            {loading ? (
              <SectionLoader
                label="Loading products…"
                stepLabel="Fetching catalogue"
                progress={progress}
              />
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

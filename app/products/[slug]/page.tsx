"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GsapReveal } from "@/components/animation/GsapReveal";
import { Magnetic } from "@/components/animation/Magnetic";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { GridColumns } from "@/components/decorative/GridColumns";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { MediaGallery } from "@/components/media/MediaGallery";
import { AsyncState } from "@/components/feedback/AsyncState";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { getProduct } from "@/lib/api/products";
import { ApiClientError } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = use(params);
  const { addItem, hasItem } = useCart();
  const { success } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );
  const [progress, setProgress] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProduct(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setStatus("ready");
        setProgress(100);
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus(
          error instanceof ApiClientError && error.status === 404
            ? "missing"
            : "error"
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (status === "missing") notFound();

  if (status === "error") {
    return (
      <PageContainer className="pt-32 pb-20">
        <AsyncState
          kind="error"
          title="The product sheet could not be loaded"
          message="Check your connection and try opening this product again."
          onRetry={() => {
            setStatus("loading");
            setReloadKey((value) => value + 1);
          }}
          actionHref="/products"
          actionLabel="Product catalogue"
        />
      </PageContainer>
    );
  }

  if (status === "loading" || !product) {
    return (
      <PageContainer className="pt-32 pb-20">
        <SectionLoader
          label="Loading product…"
          stepLabel="Fetching catalogue sheet"
          progress={progress}
          fullScreen
        />
      </PageContainer>
    );
  }

  const inCart = hasItem(product.id) || justAdded;
  const gallery =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  function handleAdd() {
    addItem({
      id: product!.id,
      name: product!.name,
      price: product!.price,
      kind: "product",
      category: product!.category,
      image: product!.image,
    });
    setJustAdded(true);
    success("Added to cart");
  }

  return (
    <>
      <header className="relative overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-0">
          <GsapReveal type="text" immediate>
            <p className="eyebrow mb-3">
              <Link href="/products" className="hover:text-clay">
                Products
              </Link>{" "}
              · {product.category}
            </p>
          </GsapReveal>
          <SplitTextReveal type="lines" immediate>
            <h1 className="type-display max-w-4xl mb-8">{product.name}</h1>
          </SplitTextReveal>

          <ThresholdFrame label={`Sheet — ${product.id}`}>
            <MediaBay
              src={product.image}
              alt={product.name}
              className="aspect-[16/10] lg:aspect-[21/9] mt-4"
              fallback="product"
              morph
              priority
              revealOnLoad
              sizes="100vw"
            />
          </ThresholdFrame>
        </PageContainer>
      </header>

      <ThresholdDoorway label={product.id} />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="hairline-border p-6 lg:p-8">
                <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
                <p className="label-caps mb-2">Category</p>
                <p className="type-infill mb-6">{product.category}</p>
                <p className="label-caps mb-2">Price</p>
                <p className="type-display text-clay mb-8">{product.price}</p>
                <Magnetic>
                  <button
                    type="button"
                    className="cta-entrance disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleAdd}
                    disabled={inCart}
                  >
                    {inCart ? "In cart" : "Add to cart"}
                  </button>
                </Magnetic>
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <GsapReveal type="text">
                <p className="type-lead max-w-xl">{product.description}</p>
              </GsapReveal>
            </div>
          </div>
        </PageContainer>
      </Section>

      {gallery.length > 0 && (
        <Section rhythm="intimate" contained={false}>
          <PageContainer>
            <ThresholdFrame label="Product plates">
              <div className="pt-6">
                <MediaGallery images={gallery} title={product.name} fallback="product" />
              </div>
            </ThresholdFrame>
          </PageContainer>
        </Section>
      )}
    </>
  );
}

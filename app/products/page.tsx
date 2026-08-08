"use client";

import { useEffect, useMemo, useState } from "react";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { ProductCard } from "@/components/products/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { AsyncState } from "@/components/feedback/AsyncState";
import { apiGet } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";

type SortOption = "featured" | "name" | "price-asc" | "price-desc";
const PRODUCTS_PER_PAGE = 8;

function getNumericPrice(price: string) {
  const value = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    apiGet<Product[]>("/api/products", undefined, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const featured = products.slice(0, 4);
  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.category))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matches = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        query.length === 0 ||
        [product.name, product.description, product.category].some((value) =>
          value.toLocaleLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-asc") {
        return getNumericPrice(a.price) - getNumericPrice(b.price);
      }
      if (sortBy === "price-desc") {
        return getNumericPrice(b.price) - getNumericPrice(a.price);
      }
      return 0;
    });
  }, [products, searchQuery, selectedCategory, sortBy]);
  const hasActiveFilters =
    searchQuery.length > 0 ||
    selectedCategory !== "All" ||
    sortBy !== "featured";
  const pageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const currentPage = Math.min(page, pageCount);
  const pageOffset = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    pageOffset,
    pageOffset + PRODUCTS_PER_PAGE,
  );

  function clearFilters() {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("featured");
    setPage(1);
  }

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
            ) : loadError ? (
              <AsyncState
                kind="error"
                title="The product catalogue could not be loaded"
                message="Check your connection and try loading the catalogue again."
                onRetry={() => setReloadKey((value) => value + 1)}
              />
            ) : products.length === 0 ? (
              <AsyncState
                title="No products are available"
                message="The catalogue is currently empty. Please check back soon."
              />
            ) : (
              <>
                <div
                  className="mt-6 border-y border-hairline py-5"
                  aria-label="Product filters"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                      <label className="label-caps mb-2 block" htmlFor="product-search">
                        Search catalogue
                      </label>
                      <input
                        id="product-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value);
                          setPage(1);
                        }}
                        placeholder="Search products, categories…"
                        className="w-full border-b border-charcoal/30 bg-transparent py-2 font-sans text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal-infill/60 focus:border-clay"
                      />
                    </div>
                    <div className="min-w-48">
                      <label className="label-caps mb-2 block" htmlFor="product-sort">
                        Sort by
                      </label>
                      <select
                        id="product-sort"
                        value={sortBy}
                        onChange={(event) => {
                          setSortBy(event.target.value as SortOption);
                          setPage(1);
                        }}
                        className="w-full border-b border-charcoal/30 bg-concrete py-2 font-sans text-sm text-charcoal outline-none transition-colors focus:border-clay"
                      >
                        <option value="featured">Featured</option>
                        <option value="name">Name A–Z</option>
                        <option value="price-asc">Price: low to high</option>
                        <option value="price-desc">Price: high to low</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                    {["All", ...categories].map((category) => {
                      const isActive = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setPage(1);
                          }}
                          aria-pressed={isActive}
                          className={`label-caps border-b pb-1 transition-colors ${
                            isActive
                              ? "border-clay text-charcoal"
                              : "border-transparent hover:border-charcoal/30 hover:text-charcoal"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-hairline pt-4">
                    <p className="type-infill" aria-live="polite">
                      {filteredProducts.length}{" "}
                      {filteredProducts.length === 1 ? "product" : "products"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="action-secondary shrink-0"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="pt-6">
                    <AsyncState
                      title="No products match your filters"
                      message="Try another search term or clear the current filters."
                    />
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="action-primary mt-5"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    <GsapStagger
                      key={currentPage}
                      className="bay-grid pt-6"
                    >
                      {paginatedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="col-span-12 bg-concrete group sm:col-span-6 lg:col-span-3"
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

                    {pageCount > 1 && (
                      <nav
                        className="mt-8 flex items-center justify-between gap-5 border-t border-hairline pt-5"
                        aria-label="Product pagination"
                      >
                        <button
                          type="button"
                          className="action-secondary"
                          onClick={() =>
                            setPage((value) => Math.max(1, value - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        <p
                          className="label-caps text-center tabular-nums"
                          aria-live="polite"
                        >
                          Page {String(currentPage).padStart(2, "0")} /{" "}
                          {String(pageCount).padStart(2, "0")}
                          <span className="sr-only">
                            , showing products {pageOffset + 1} through{" "}
                            {Math.min(
                              pageOffset + PRODUCTS_PER_PAGE,
                              filteredProducts.length,
                            )}{" "}
                            of {filteredProducts.length}
                          </span>
                        </p>
                        <button
                          type="button"
                          className="action-secondary"
                          onClick={() =>
                            setPage((value) =>
                              Math.min(pageCount, value + 1),
                            )
                          }
                          disabled={currentPage === pageCount}
                        >
                          Next
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}

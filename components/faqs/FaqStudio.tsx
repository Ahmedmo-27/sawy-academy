"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Faq } from "@/lib/api/types";

interface FaqStudioProps {
  faqs: Faq[];
  loadError?: boolean;
}

function FaqItem({
  faq,
  index,
  open,
  onToggle,
}: {
  faq: Faq;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${faq.id}`;
  const buttonId = `faq-button-${faq.id}`;

  return (
    <article className={index > 0 ? "hairline-t" : ""}>
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-4 py-6 text-left transition-colors hover:text-clay sm:gap-6 sm:py-7"
        >
          <span className="mt-1 shrink-0 font-sans text-xs uppercase tracking-[0.16em] text-clay sm:text-sm">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 font-serif text-xl font-light leading-snug text-charcoal sm:text-2xl">
            {faq.question}
          </span>
          <span
            aria-hidden="true"
            className="mt-1 shrink-0 font-serif text-2xl font-light leading-none text-clay"
          >
            {open ? "−" : "+"}
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="pb-7 pl-10 pr-8 sm:pl-14 sm:pr-12"
      >
        <p className="type-body max-w-2xl whitespace-pre-line text-charcoal-muted">
          {faq.answer}
        </p>
      </div>
    </article>
  );
}

export function FaqStudio({ faqs, loadError = false }: FaqStudioProps) {
  const categories = useMemo(() => {
    const values = [
      ...new Set(
        faqs
          .map((faq) => faq.category?.trim())
          .filter((value): value is string => Boolean(value))
      ),
    ];
    return values;
  }, [faqs]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  const visibleFaqs = useMemo(() => {
    if (selectedCategory === "All") return faqs;
    return faqs.filter((faq) => faq.category?.trim() === selectedCategory);
  }, [faqs, selectedCategory]);

  if (loadError) {
    return (
      <section className="section-standard">
        <PageContainer>
          <p className="type-body text-charcoal-muted">
            The questions could not be loaded just now. Please refresh, or{" "}
            <Link href="/contact" className="text-clay underline-offset-4 hover:underline">
              contact the studio
            </Link>
            .
          </p>
        </PageContainer>
      </section>
    );
  }

  if (!faqs.length) {
    return (
      <section className="section-standard">
        <PageContainer>
          <p className="eyebrow mb-5 text-clay">Nothing filed yet</p>
          <h2 className="type-display max-w-xl">Questions will appear here.</h2>
          <p className="type-body mt-6 max-w-lg">
            In the meantime, write to the studio and we will reply with a clear
            next step.
          </p>
          <Link href="/contact" className="action-secondary mt-10 inline-flex">
            Contact the studio
          </Link>
        </PageContainer>
      </section>
    );
  }

  return (
    <section className="section-standard">
      <PageContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
          <div className="lg:col-span-4 lg:pr-12">
            <Reveal variant="structural">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow mb-5 text-clay">Index</p>
                <h2 className="type-display max-w-sm">
                  Answers, filed with care.
                </h2>
                <p className="type-body mt-6 max-w-sm">
                  Enrolment, payments, courses, and studio visits. If your
                  question is not here, write to us.
                </p>
                {categories.length > 0 && (
                  <div className="mt-10 flex flex-wrap gap-2">
                    {["All", ...categories].map((category) => {
                      const active = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setOpenId(null);
                          }}
                          className={`label-caps border px-3 py-2 transition-colors ${
                            active
                              ? "border-clay bg-clay text-concrete"
                              : "border-hairline text-charcoal-muted hover:border-clay hover:text-clay"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Link
                  href="/contact"
                  className="mt-10 inline-flex items-center gap-3 text-sm text-clay transition-colors hover:text-charcoal"
                >
                  <span className="block h-px w-8 bg-clay" />
                  Still need help? Contact the studio
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-8 lg:border-l lg:border-hairline lg:pl-12 xl:pl-16">
            <Reveal variant="infill" delay={120}>
              <div className="hairline-border bg-concrete px-4 sm:px-6">
                {visibleFaqs.map((faq, index) => (
                  <FaqItem
                    key={faq.id}
                    faq={faq}
                    index={index}
                    open={openId === faq.id}
                    onToggle={() =>
                      setOpenId((current) => (current === faq.id ? null : faq.id))
                    }
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { CourseImagePlaceholder } from "@/components/cart/CourseImagePlaceholder";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { formatPrice, parsePrice } from "@/lib/cart/pricing";

function OrderSummary({
  count,
  subtotalLabel,
}: {
  count: number;
  subtotalLabel: string;
}) {
  return (
    <aside className="hairline-border bg-concrete p-[var(--spacing-gutter)]">
      <header className="pb-2">
        <ScaleBar scale="1:100" className="mb-2 max-w-[120px]" />
        <h2 className="type-title text-xl">Project / Order Summary</h2>
      </header>

      <div className="hairline-t" aria-hidden="true" />

      <div className="hairline-b flex items-baseline justify-between gap-4 py-2">
        <p className="label-caps">Items</p>
        <p className="type-infill tabular-nums">{count}</p>
      </div>

      <div className="hairline-b flex items-baseline justify-between gap-4 py-2">
        <p className="label-caps">Subtotal</p>
        <p className="type-infill tabular-nums">{subtotalLabel}</p>
      </div>

      <div className="hairline-b flex items-baseline justify-between gap-4 py-2">
        <p className="label-caps shrink-0">Payment</p>
        <p className="type-infill text-right leading-snug max-w-[11rem]">
          Verified manually via InstaPay
        </p>
      </div>

      <div className="border-t-2 border-charcoal/25" aria-hidden="true" />

      <div className="flex items-baseline justify-between gap-4 py-2 mb-3">
        <p className="label-caps text-charcoal">Total</p>
        <p className="type-title text-xl tabular-nums">{subtotalLabel}</p>
      </div>

      <Link href="/checkout" className="cta-entrance w-full justify-center">
        Proceed to Checkout
      </Link>
    </aside>
  );
}

export function CartView() {
  const {
    items,
    count,
    subtotalLabel,
    hydrated,
    removeItem,
    updateQuantity,
  } = useCart();
  const { neutral } = useToast();

  function handleRemove(id: string) {
    removeItem(id);
    neutral("Removed from cart");
  }

  if (!hydrated) {
    return (
      <p className="label-caps text-charcoal-muted loader-pulse">
        Reading sheet
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hairline-border bg-concrete-dark/30 p-8 lg:p-12">
        <p className="eyebrow text-clay">Empty sheet</p>
        <p className="type-infill mt-3 max-w-md">
          No line items on this order yet. Browse the product bay to begin.
        </p>
        <Link href="/products" className="action-primary mt-8 inline-flex">
          View products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter)] items-start">
      <div className="lg:col-span-8 min-w-0">
        <p className="label-caps mb-4 text-charcoal-infill/70">
          Line Items · {count}
        </p>

        <ul className="space-y-0">
          {items.map((item) => {
            const lineTotal = formatPrice(
              parsePrice(item.price) * item.quantity
            );

            return (
              <li
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-[5.5rem_1fr] gap-5 py-6 hairline-b first:pt-0"
              >
                <div className="w-[5.5rem] sm:w-auto">
                  {item.image ? (
                    <ImageFrame className="aspect-square max-w-[5.5rem]">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="88px"
                      />
                    </ImageFrame>
                  ) : item.kind === "course" || item.kind === "diploma" ? (
                    <CourseImagePlaceholder kind={item.kind} />
                  ) : (
                    <div
                      className="aspect-square max-w-[5.5rem] hairline-border bg-concrete-dark/40"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="min-w-0 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      {(item.category || item.kind) && (
                        <p className="label-caps mb-2">
                          {item.category ?? item.kind}
                        </p>
                      )}
                      <p className="type-title text-xl">{item.name}</p>
                      <p className="type-infill mt-1 tabular-nums">
                        {item.price}
                      </p>
                    </div>
                    <p className="type-title text-base tabular-nums shrink-0">
                      {lineTotal}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="action-secondary tabular-nums min-w-[1.5rem]"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => {
                          if (item.quantity <= 1) {
                            handleRemove(item.id);
                            return;
                          }
                          updateQuantity(item.id, item.quantity - 1);
                        }}
                      >
                        −
                      </button>
                      <span className="type-body tabular-nums w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="action-secondary tabular-nums min-w-[1.5rem]"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="action-secondary"
                      onClick={() => handleRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="lg:col-span-4 self-start">
        <OrderSummary count={count} subtotalLabel={subtotalLabel} />
      </div>
    </div>
  );
}

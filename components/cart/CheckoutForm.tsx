"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { AsyncState } from "@/components/feedback/AsyncState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { PaymentProofUpload } from "@/components/forms/PaymentProofUpload";
import { createOrder } from "@/lib/api/orders";
import { ApiClientError } from "@/lib/api/client";
import { checkoutSchema } from "@/lib/validation/forms";

export function CheckoutForm() {
  const router = useRouter();
  const { items, count, subtotalLabel, clearCart, hydrated } = useCart();
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    const result = checkoutSchema.safeParse({ screenshotUrl });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Upload payment proof.");
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          kind: item.kind,
          name: item.name,
          price: item.price,
        })),
        screenshotUrl: result.data.screenshotUrl,
      });
      clearCart();
      router.replace(
        `/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to submit order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div role="status" aria-label="Loading checkout" className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <AsyncState
        title="Nothing to settle"
        message="Add line items before uploading payment proof."
        actionLabel="View products"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="hairline-border p-6 lg:p-10 mt-4 bg-concrete/80 w-full">
      <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

      <div className="hairline-b pb-6 mb-6">
        <p className="label-caps mb-2">Project</p>
        <h2 className="type-title">Checkout</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 hairline-b py-6 mb-6">
        <div>
          <p className="label-caps mb-2">Items</p>
          <p className="type-infill tabular-nums">{count}</p>
        </div>
        <div>
          <p className="label-caps mb-2">Total</p>
          <p className="type-title text-xl tabular-nums">{subtotalLabel}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <FormErrorSummary errors={error ? [error] : []} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 hairline-b py-6 mb-6">
          <div>
            <p className="label-caps mb-2">Payment</p>
            <p className="type-infill leading-relaxed max-w-md">
              Transfer the order total via InstaPay, then upload a clear
              screenshot of the confirmation. Studio staff will verify the
              amount manually — no card gateway on this sheet.
            </p>
          </div>
          <PaymentProofUpload
            value={screenshotUrl}
            onChange={setScreenshotUrl}
            disabled={submitting}
            error={
              error === "Upload an InstaPay payment screenshot to continue."
                ? error
                : undefined
            }
          />
        </div>

        {error && (
          <p className="type-body text-clay mb-6" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="submit"
            className="cta-entrance"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Submitting…" : "Submit for Verification"}
          </button>
          <Link href="/cart" className="action-secondary">
            Back to cart
          </Link>
        </div>
      </form>
    </div>
  );
}

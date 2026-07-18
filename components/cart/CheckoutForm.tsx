"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useCart } from "@/components/cart/CartProvider";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { createOrder } from "@/lib/api/orders";
import { ApiClientError } from "@/lib/api/client";

export function CheckoutForm() {
  const router = useRouter();
  const { items, count, subtotalLabel, clearCart, hydrated } = useCart();
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!screenshotUrl) {
      setError("Upload an InstaPay payment screenshot to continue.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Confirm create-order payload against the real POST /api/orders contract.
      await createOrder({
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          kind: item.kind,
          name: item.name,
          price: item.price,
        })),
        screenshotUrl,
      });
      clearCart();
      // TODO: Route to an order-confirmation sheet once that page exists.
      router.replace("/cart");
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
      <p className="label-caps text-charcoal-muted loader-pulse">
        Reading sheet
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">Nothing to settle</p>
        <p className="type-infill mt-3 max-w-md">
          Add line items before uploading payment proof.
        </p>
        <Link href="/products" className="action-primary mt-8 inline-flex">
          View products
        </Link>
      </div>
    );
  }

  return (
    <div className="hairline-border p-8 lg:p-10 mt-4 bg-concrete/80 w-full">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 hairline-b py-6 mb-6">
          <div>
            <p className="label-caps mb-2">Payment</p>
            <p className="type-infill leading-relaxed max-w-md">
              Transfer the order total via InstaPay, then upload a clear
              screenshot of the confirmation. Studio staff will verify the
              amount manually — no card gateway on this sheet.
            </p>
          </div>
          <ImageUploadField
            label="InstaPay Screenshot"
            description="Upload a clear screenshot of your InstaPay payment confirmation. Image files only."
            value={screenshotUrl}
            onChange={setScreenshotUrl}
            required
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

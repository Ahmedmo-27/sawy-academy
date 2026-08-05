"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { OrderSubmitted } from "@/components/cart/OrderSubmitted";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiGet } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

export function OrderConfirmationView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  const loader = useCallback(
    (onProgress: (progress: number) => void) => {
      if (!orderId) {
        throw new Error("Missing order reference.");
      }
      return apiGet<Order>(`/api/orders/${orderId}`, undefined, { onProgress });
    },
    [orderId]
  );

  const { data: order, isLoading, error, progress, stepLabel } =
    useAdminResource(loader, "Reading sheet");

  if (!orderId) {
    return (
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">No order on file</p>
        <p className="type-infill mt-3 max-w-md">
          This confirmation sheet needs an order reference. Return to checkout if
          you still have items to settle.
        </p>
        <Link href="/cart" className="action-primary mt-8 inline-flex">
          Back to cart
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <SectionLoader
        label="Reading sheet"
        stepLabel={stepLabel}
        progress={progress}
        className="py-8"
      />
    );
  }

  if (error || !order) {
    return (
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">Unable to load order</p>
        <p className="type-infill mt-3 max-w-md">
          {error ?? "This order may not exist or you may not have access to it."}
        </p>
        <Link href="/dashboard/profile" className="action-primary mt-8 inline-flex">
          View order history
        </Link>
      </div>
    );
  }

  return <OrderSubmitted order={order} />;
}

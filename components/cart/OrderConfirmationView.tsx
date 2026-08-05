"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { OrderSubmitted } from "@/components/cart/OrderSubmitted";
import { useAdminResource } from "@/hooks/useAdminResource";
import { getOrder } from "@/lib/api/orders";

export function OrderConfirmationView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  const loader = useCallback(() => {
    if (!orderId) {
      throw new Error("Missing order reference.");
    }
    return getOrder(orderId);
  }, [orderId]);

  const { data: order, isLoading, error } = useAdminResource(loader);

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
      <p className="label-caps text-charcoal-muted loader-pulse">
        Reading sheet
      </p>
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

import Link from "next/link";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { BRAND } from "@/lib/branding";
import type { Order } from "@/lib/api/types";

interface OrderSubmittedProps {
  order: Order;
}

function formatAmount(amount: number | string) {
  if (typeof amount === "number") {
    return `EGP ${amount.toLocaleString()}`;
  }
  return String(amount);
}

export function OrderSubmitted({ order }: OrderSubmittedProps) {
  const itemSummary =
    order.items?.map((item) => item.title).join(", ") || "Your cart items";

  return (
    <ThresholdFrame label="Submission stamp">
      <div className="hairline-border p-8 lg:p-10 mt-4 bg-concrete/80">
        <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Status</p>
          <p className="type-title">Order Submitted</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 hairline-b pb-6 mb-6">
          <div>
            <p className="label-caps mb-2">Order</p>
            <p className="type-body">{order.id}</p>
          </div>
          <div>
            <p className="label-caps mb-2">Total</p>
            <p className="type-body tabular-nums">{formatAmount(order.amount)}</p>
          </div>
        </div>

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Items</p>
          <p className="type-body">{itemSummary}</p>
        </div>

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Next step</p>
          <p className="type-infill leading-relaxed">
            {BRAND.professorTitle}&apos;s office will verify your InstaPay
            screenshot and update this order. You can track the status from your
            profile order history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Link href="/dashboard/profile" className="action-primary">
            View order history
          </Link>
          <Link href="/courses" className="action-secondary">
            Browse courses
          </Link>
        </div>
      </div>
    </ThresholdFrame>
  );
}

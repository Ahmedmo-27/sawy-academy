"use client";

import Image from "next/image";
import { useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { useAdminResource } from "@/hooks/useAdminResource";
import { listMyOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";

function screenshotUrl(order: Order) {
  return order.paymentScreenshotUrl ?? order.instaPayScreenshot ?? "";
}

function formatOrderDate(order: Order) {
  const raw = order.submittedAt ?? order.createdAt;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number | string) {
  if (typeof amount === "number") {
    return `EGP ${amount.toLocaleString()}`;
  }
  return String(amount);
}

function itemLabels(order: Order) {
  if (!order.items?.length) return "No line items recorded";
  return order.items.map((item) => item.title).join(", ");
}

export function OrderHistorySection() {
  const { data, isLoading, error, refetch } = useAdminResource(listMyOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <AdminLoader label="Loading order history" />;
  }

  if (error) {
    return (
      <ThresholdFrame label="ORDER HISTORY" labelAsHeading>
        <div className="hairline-border bg-concrete p-8">
          <p className="eyebrow text-clay">Unable to load orders</p>
          <p className="type-infill mt-3">{error}</p>
          <button
            type="button"
            className="action-primary mt-6"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </ThresholdFrame>
    );
  }

  if (!data?.length) {
    return (
      <ProfileEmptyState
        title="No orders on this sheet yet"
        message="Verified purchases and pending InstaPay submissions will draw here once you place an order."
        actionHref="/courses"
        actionLabel="Browse courses"
      />
    );
  }

  return (
    <ThresholdFrame label="ORDER HISTORY" labelAsHeading>
      <div className="mt-4 hairline-border bg-concrete overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[7rem_minmax(0,1.4fr)_6rem_7rem_auto] gap-4 px-6 py-4 hairline-b bg-concrete-dark/40">
          <p className="label-caps">Date</p>
          <p className="label-caps">Items</p>
          <p className="label-caps">Total</p>
          <p className="label-caps">Status</p>
          <p className="label-caps sr-only">Expand</p>
        </div>

        <ul>
          {data.map((order) => {
            const isOpen = expandedId === order.id;
            const shot = screenshotUrl(order);

            return (
              <li key={order.id} className="hairline-b last:border-b-0">
                <button
                  type="button"
                  className="w-full text-left px-6 py-5 grid grid-cols-1 gap-3 md:grid-cols-[7rem_minmax(0,1.4fr)_6rem_7rem_auto] md:gap-4 md:items-center hover:bg-concrete-dark/30 transition-colors duration-200"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === order.id ? null : order.id
                    )
                  }
                  aria-expanded={isOpen}
                >
                  <p className="type-infill">{formatOrderDate(order)}</p>
                  <p className="type-body text-charcoal">{itemLabels(order)}</p>
                  <p className="type-infill">{formatAmount(order.amount)}</p>
                  <div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="label-caps text-charcoal-infill md:text-right">
                    {isOpen ? "Collapse" : "Details"}
                  </p>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 bg-concrete-dark/20 space-y-6">
                    {shot ? (
                      <div>
                        <p className="label-caps mb-3">InstaPay screenshot</p>
                        <ImageFrame className="max-w-md">
                          <div className="relative aspect-[4/3] bg-concrete-dark">
                            <Image
                              src={shot}
                              alt="Uploaded InstaPay payment screenshot"
                              fill
                              unoptimized
                              sizes="(min-width: 768px) 28rem, 100vw"
                              className="object-contain"
                            />
                          </div>
                        </ImageFrame>
                      </div>
                    ) : (
                      <p className="type-infill">
                        No payment screenshot recorded for this order.
                      </p>
                    )}

                    {order.status === "rejected" && order.reason && (
                      <div>
                        <p className="label-caps mb-2">Rejection reason</p>
                        <p className="type-body text-clay whitespace-pre-wrap">
                          {order.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </ThresholdFrame>
  );
}

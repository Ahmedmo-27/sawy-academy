"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";
import {
  ProfileSectionError,
  ProfileSectionLoading,
} from "@/components/profile/ProfileSectionState";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
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

function itemCount(order: Order) {
  return order.items?.length ?? 0;
}

export function OrderHistorySection() {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<Order[]>(
        "/api/orders",
        "Fetching order history",
        onProgress,
        { userId: "me" }
      ),
    []
  );
  const { data, isLoading, error, refetch } =
    useAdminResource(loader, "Loading order history");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <ProfileSectionLoading id="orders" label="Order history" />;
  }

  if (error) {
    return (
      <ProfileSectionError
        id="orders"
        label="Order history"
        title="Unable to load orders"
        message={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!data?.length) {
    return (
      <div id="orders" className="scroll-mt-28 lg:scroll-mt-32">
        <ProfileEmptyState
          title="No orders on this sheet yet"
          message="Verified purchases and pending InstaPay submissions will draw here once you place an order."
          actionHref="/courses"
          actionLabel="Browse courses"
        />
      </div>
    );
  }

  return (
    <ProfileSectionShell id="orders" label="Order history">
      <p className="type-infill mt-2 mb-4 text-charcoal-infill">
        {data.length} order{data.length === 1 ? "" : "s"} recorded — expand a
        row for payment proof and studio notes.
      </p>

      <div className="hairline-border overflow-hidden bg-concrete">
        <ul>
          {data.map((order) => {
            const isOpen = expandedId === order.id;
            const shot = screenshotUrl(order);
            const count = itemCount(order);

            return (
              <li key={order.id} className="hairline-b last:border-b-0">
                <button
                  type="button"
                  className="grid w-full grid-cols-1 gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-concrete-dark/30 sm:px-6 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === order.id ? null : order.id
                    )
                  }
                  aria-expanded={isOpen}
                  aria-controls={`order-details-${order.id}`}
                >
                  <div>
                    <p className="label-caps mb-1 text-charcoal/35 sm:hidden">
                      Date
                    </p>
                    <p className="type-infill tabular-nums">
                      {formatOrderDate(order)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="type-body text-charcoal line-clamp-2">
                      {itemLabels(order)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className="type-infill tabular-nums">
                        {formatAmount(order.amount)}
                      </p>
                      {count > 0 && (
                        <p className="label-caps text-charcoal-infill">
                          {count} item{count === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <StatusBadge status={order.status} />
                    <span
                      aria-hidden="true"
                      className={`label-caps text-charcoal-infill transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ⌄
                    </span>
                    <span className="sr-only">
                      {isOpen ? "Collapse details" : "Expand details"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`order-details-${order.id}`}
                    className="space-y-6 border-t border-hairline bg-concrete-dark/20 px-5 py-6 sm:px-6"
                  >
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
    </ProfileSectionShell>
  );
}

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, DataTableSkeleton } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import type { Order } from "@/lib/api/types";

function orderKey(order: Order) {
  return order._id ?? order.id;
}

export function OrderQueuePage() {
  const router = useRouter();
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<Order[]>("/api/orders", "Fetching orders", onProgress),
    []
  );
  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading…");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Payments"
        title="Orders"
        description="Check student payment photos and approve or reject them."
        guidance="Choose “Review payment” to open the full order before making a decision."
      />

      {isLoading && (
        <div>
          <p className="dim-label mb-3" role="status">{stepLabel} · {Math.round(progress ?? 0)}%</p>
          <DataTableSkeleton />
        </div>
      )}
      {!isLoading && error && (
        <AdminErrorState
          title="Orders aren't available yet"
          message="Payment orders will appear here once that part of the system is connected. You can keep using Courses, Products, and the other sections."
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !error && data && (
        <DataTable
          data={data}
          getRowKey={orderKey}
          emptyMessage="No payments are waiting for review."
          searchPlaceholder="Search orders or students"
          getSearchText={(order) =>
            [order.id, order.userName, order.userEmail, order.status, order.amount]
              .filter(Boolean)
              .join(" ")
          }
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: Array.from(new Set(data.map((order) => order.status))).map((status) => ({
                label: status,
                value: status,
              })),
              getValue: (order) => order.status,
            },
          ]}
          columns={[
            {
              key: "id",
              header: "Order",
              sortable: true,
              render: (order) => order.id,
              sortValue: (order) => order.id,
            },
            {
              key: "name",
              header: "Student",
              sortable: true,
              render: (order) => order.userName ?? order.userEmail ?? "Unknown",
              sortValue: (order) => order.userName ?? order.userEmail ?? "",
            },
            {
              key: "amount",
              header: "Amount",
              sortable: true,
              render: (order) => String(order.amount),
              sortValue: (order) => Number(order.amount) || 0,
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (order) => <StatusBadge status={order.status} />,
              sortValue: (order) => order.status,
            },
            {
              key: "timestamp",
              header: "Submitted",
              sortable: true,
              render: (order) =>
                order.submittedAt ?? order.createdAt ?? "Not recorded",
              sortValue: (order) => order.submittedAt ?? order.createdAt ?? "",
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (order) => (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => router.push(`/admin/orders/${orderKey(order)}`)}
                >
                  Review payment
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

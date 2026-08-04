"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminResource } from "@/hooks/useAdminResource";
import { listOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";

function orderKey(order: Order) {
  return order._id ?? order.id;
}

export function OrderQueuePage() {
  const router = useRouter();
  const loader = useCallback(() => listOrders(), []);
  const { data, isLoading, error, refetch } = useAdminResource(loader);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Payments"
        title="Orders"
        description="Check student payment photos and approve or reject them."
      />

      {isLoading && <AdminLoader label="Loading…" />}
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
          onRowClick={(order) => router.push(`/admin/orders/${orderKey(order)}`)}
          emptyMessage="No payments are waiting for review."
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
              header: "Timestamp",
              sortable: true,
              render: (order) =>
                order.submittedAt ?? order.createdAt ?? "Not recorded",
              sortValue: (order) => order.submittedAt ?? order.createdAt ?? "",
            },
          ]}
        />
      )}
    </div>
  );
}

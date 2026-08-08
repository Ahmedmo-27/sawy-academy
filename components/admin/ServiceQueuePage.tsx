"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, DataTableSkeleton } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import type { ServiceRequest } from "@/lib/api/types";

function requestKey(request: ServiceRequest) {
  return request._id ?? request.id;
}

export function ServiceQueuePage() {
  const router = useRouter();
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<ServiceRequest[]>(
        "/api/services",
        "Fetching service requests",
        onProgress
      ),
    []
  );
  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading…");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Requests"
        title="Service requests"
        description="Messages from people asking for design, research, collaboration, or device access help."
        guidance="Choose “Open request” to read the full message and update its status."
      />

      {isLoading && (
        <div>
          <p className="dim-label mb-3" role="status">{stepLabel} · {Math.round(progress ?? 0)}%</p>
          <DataTableSkeleton />
        </div>
      )}
      {!isLoading && error && (
        <AdminErrorState
          title="Service requests aren't available yet"
          message="Incoming requests will appear here once that part of the system is connected. You can keep using Courses, Products, and the other sections."
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !error && data && (
        <DataTable
          data={data}
          getRowKey={requestKey}
          emptyMessage="No service requests are waiting for review."
          searchPlaceholder="Search requests"
          getSearchText={(request) =>
            [request.name, request.email, request.type, request.status]
              .filter(Boolean)
              .join(" ")
          }
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: Array.from(new Set(data.map((request) => request.status))).map((status) => ({
                label: status,
                value: status,
              })),
              getValue: (request) => request.status,
            },
            {
              key: "type",
              label: "Types",
              options: Array.from(new Set(data.map((request) => request.type))).map((type) => ({
                label: type,
                value: type,
              })),
              getValue: (request) => request.type,
            },
          ]}
          columns={[
            {
              key: "name",
              header: "Name",
              sortable: true,
              render: (request) => request.name,
              sortValue: (request) => request.name,
            },
            {
              key: "email",
              header: "Email",
              sortable: true,
              render: (request) => request.email,
              sortValue: (request) => request.email,
            },
            {
              key: "type",
              header: "Type",
              sortable: true,
              render: (request) => request.type,
              sortValue: (request) => request.type,
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (request) => <StatusBadge status={request.status} />,
              sortValue: (request) => request.status,
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (request) => (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => router.push(`/admin/services/${requestKey(request)}`)}
                >
                  Open request
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

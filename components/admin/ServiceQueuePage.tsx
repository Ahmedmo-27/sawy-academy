"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
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
      />

      {isLoading && (
        <AdminLoader
          label="Loading…"
          stepLabel={stepLabel}
          progress={progress}
          fullScreen
        />
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
          onRowClick={(request) =>
            router.push(`/admin/services/${requestKey(request)}`)
          }
          emptyMessage="No service requests are waiting for review."
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
          ]}
        />
      )}
    </div>
  );
}

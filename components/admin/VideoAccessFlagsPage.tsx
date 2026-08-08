"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, DataTableSkeleton } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminResource } from "@/hooks/useAdminResource";
import { listVideoAccessFlags } from "@/lib/api/videoAccessFlags";
import type { VideoAccessFlag } from "@/lib/api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function VideoAccessFlagsPage() {
  const router = useRouter();
  const loader = useCallback(() => listVideoAccessFlags({ limit: 100 }), []);
  const { data, isLoading, error, refetch } = useAdminResource(
    loader,
    "Loading video access flags"
  );
  const flags = data?.flags ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Access review"
        title="Video access flags"
        description="Review unusual protected-video key activity. Flags never automatically suspend an account."
      />

      {isLoading && <DataTableSkeleton />}
      {!isLoading && error && (
        <AdminErrorState
          title="Video access flags are unavailable"
          message={error}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !error && (
        <DataTable<VideoAccessFlag>
          data={flags}
          getRowKey={(flag) => flag._id}
          onRowClick={(flag) =>
            router.push(`/admin/video-access-flags/${flag._id}`)
          }
          emptyMessage="No video access activity is waiting for review."
          searchPlaceholder="Search student, email, lesson, or status"
          getSearchText={(flag) =>
            [
              flag.userId.name,
              flag.userId.email,
              flag.lessonId.title,
              flag.status,
              flag.deviceId,
            ].join(" ")
          }
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: ["open", "in_review", "resolved", "dismissed"].map(
                (value) => ({ label: value.replace("_", " "), value })
              ),
              getValue: (flag) => flag.status,
            },
          ]}
          columns={[
            {
              key: "student",
              header: "Student",
              sortable: true,
              render: (flag) => (
                <span>
                  <span className="block">{flag.userId.name}</span>
                  <span className="type-infill">{flag.userId.email}</span>
                </span>
              ),
              sortValue: (flag) => flag.userId.name,
            },
            {
              key: "lesson",
              header: "Lesson",
              sortable: true,
              render: (flag) => flag.lessonId.title,
              sortValue: (flag) => flag.lessonId.title,
            },
            {
              key: "ips",
              header: "Distinct IPs",
              sortable: true,
              render: (flag) =>
                `${flag.distinctIpCount} / ${flag.threshold} in ${flag.windowMinutes}m`,
              sortValue: (flag) => flag.distinctIpCount,
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (flag) => (
                <StatusBadge status={flag.status.replace("_", " ")} />
              ),
              sortValue: (flag) => flag.status,
            },
            {
              key: "detected",
              header: "Last detected",
              sortable: true,
              render: (flag) => formatDate(flag.lastDetectedAt),
              sortValue: (flag) => flag.lastDetectedAt,
            },
          ]}
        />
      )}
    </div>
  );
}

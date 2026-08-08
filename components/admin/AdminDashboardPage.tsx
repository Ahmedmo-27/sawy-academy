"use client";

import { useCallback } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardSheetIndex } from "@/components/admin/DashboardSheetIndex";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAdminResource } from "@/hooks/useAdminResource";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { Skeleton } from "@/components/feedback/Skeleton";

export function AdminDashboardPage() {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      getDashboardMetrics(({ progress, stepLabel }) => {
        onProgress(progress, stepLabel);
      }),
    []
  );

  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading overview…");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A quick look at your courses, shop items, and anything waiting for your review."
      />

      {isLoading && (
        <div className="hairline-border bg-concrete p-6" role="status" aria-label="Loading dashboard overview">
          <p className="dim-label mb-5">{stepLabel} · {Math.round(progress ?? 0)}%</p>
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-6 border-t border-hairline pt-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoading && error && (
        <AdminErrorState
          title="We couldn't load the overview"
          message={error}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !error && data && (
        <ThresholdFrame label="AT A GLANCE">
          <DashboardSheetIndex metrics={data} />
        </ThresholdFrame>
      )}
    </div>
  );
}

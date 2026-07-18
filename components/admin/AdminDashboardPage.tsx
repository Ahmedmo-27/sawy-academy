"use client";

import { useCallback } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardSheetIndex } from "@/components/admin/DashboardSheetIndex";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAdminResource } from "@/hooks/useAdminResource";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import { getDashboardMetrics } from "@/lib/api/dashboard";

export function AdminDashboardPage() {
  const loader = useCallback(() => getDashboardMetrics(), []);
  const { data, isLoading, error, refetch } = useAdminResource(loader);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A quick look at your courses, shop items, and anything waiting for your review."
      />

      {isLoading && <AdminLoader label="Loading overview…" />}
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

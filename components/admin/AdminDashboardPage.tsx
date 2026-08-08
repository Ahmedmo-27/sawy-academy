"use client";

import Link from "next/link";
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
        title="What would you like to manage?"
        description="Start a common task below, or use the overview to open the area you need."
        guidance="Changes are never hidden: larger edits open on their own page, while quick edits open in a titled window with Save and Cancel."
      />

      <section className="mb-8" aria-labelledby="common-tasks">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-clay">Common tasks</p>
            <h2 id="common-tasks" className="type-title mt-1">Create or review</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/admin/courses/new", label: "Add a course", detail: "Create details, pricing and media" },
            { href: "/admin/portfolio/new", label: "Add portfolio work", detail: "Publish a new project" },
            { href: "/admin/orders", label: "Review orders", detail: "Check payments waiting for action" },
            { href: "/admin/homepage", label: "Update homepage", detail: "Arrange and edit homepage sections" },
          ].map((task) => (
            <Link
              key={task.href}
              href={task.href}
              className="group border border-hairline bg-concrete p-4 transition-colors hover:border-clay hover:bg-concrete-dark/40"
            >
              <span className="block font-sans text-sm font-semibold text-charcoal group-hover:text-clay">
                {task.label} <span aria-hidden="true">→</span>
              </span>
              <span className="type-infill mt-2 block text-charcoal-muted">{task.detail}</span>
            </Link>
          ))}
        </div>
      </section>

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
        <ThresholdFrame label="ALL ADMIN AREAS">
          <DashboardSheetIndex metrics={data} />
        </ThresholdFrame>
      )}
    </div>
  );
}

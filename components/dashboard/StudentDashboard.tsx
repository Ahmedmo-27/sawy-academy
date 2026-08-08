"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { StudentSummaryCards } from "@/components/dashboard/StudentSummaryCards";
import { AsyncState } from "@/components/feedback/AsyncState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { useAdminResource } from "@/hooks/useAdminResource";
import { getStudentDashboard } from "@/lib/api/studentDashboard";

const DASHBOARD_LINKS = [
  { href: "/dashboard", label: "Overview", current: true },
  { href: "/dashboard/profile", label: "Profile", current: false },
  {
    href: "/dashboard/profile#enrollments",
    label: "Courses",
    current: false,
  },
  { href: "/dashboard/profile#orders", label: "Orders", current: false },
  { href: "/dashboard/profile#services", label: "Requests", current: false },
  { href: "/dashboard/profile#devices", label: "Devices", current: false },
] as const;

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading student dashboard" aria-busy="true">
      <span className="sr-only">Loading student dashboard</span>
      <div className="grid gap-px bg-hairline sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="min-h-40 bg-concrete p-6 sm:p-8" aria-hidden="true">
            <Skeleton decorative className="h-3 w-28" />
            <Skeleton decorative className="mt-10 h-10 w-14" />
            <Skeleton decorative className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="hairline-border mt-10 p-6 sm:p-8" aria-hidden="true">
        <Skeleton decorative className="h-3 w-32" />
        <Skeleton decorative className="mt-5 h-8 w-2/3" />
        <Skeleton decorative className="mt-7 h-2 w-full" />
      </div>
    </div>
  );
}

export function StudentDashboard() {
  const loader = useCallback(() => getStudentDashboard(), []);
  const { data, isLoading, error, refetch } = useAdminResource(
    loader,
    "Loading student dashboard"
  );

  return (
    <>
      <nav
        aria-label="Student dashboard"
        className="mb-10 overflow-x-auto border-b border-hairline sm:mb-12"
      >
        <ul className="flex min-w-max items-end gap-1">
          {DASHBOARD_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex min-h-11 items-center px-4 label-caps transition-colors duration-200 ${
                  item.current
                    ? "text-clay"
                    : "text-charcoal-infill hover:text-charcoal"
                }`}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
                {item.current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-px bg-clay"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && (error || !data) && (
        <AsyncState
          kind="error"
          title="The dashboard could not be loaded"
          message={error || "Your student register is unavailable."}
          onRetry={() => void refetch()}
          actionHref="/dashboard/profile"
          actionLabel="Open profile"
        />
      )}

      {!isLoading && data && (
        <div aria-live="polite">
          <StudentSummaryCards dashboard={data} />
          <div className="mt-10 sm:mt-12">
            <ContinueLearningCard enrollments={data.enrollments} />
          </div>
          <div className="mt-10 flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-clay">Student profile</p>
              <p className="type-infill mt-2 max-w-xl text-charcoal-infill">
                Review your full course register, order history, service briefs,
                devices, and account settings.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="action-secondary inline-flex min-h-11 shrink-0 items-center self-start"
            >
              Open profile
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

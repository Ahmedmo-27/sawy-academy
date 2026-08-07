"use client";

import { useCallback, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import type { ServiceRequest } from "@/lib/api/types";

function formatSubmitted(request: ServiceRequest) {
  const raw = request.createdAt;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function detailText(request: ServiceRequest) {
  return request.details ?? request.message ?? "No details submitted.";
}

export function ServiceRequestsSection() {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<ServiceRequest[]>(
        "/api/services",
        "Fetching service requests",
        onProgress,
        { userId: "me" }
      ),
    []
  );
  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading service requests");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div id="services" className="scroll-mt-28 lg:scroll-mt-32">
        <AdminLoader
          label="Loading service requests"
          stepLabel={stepLabel}
          progress={progress}
        />
      </div>
    );
  }

  if (error) {
    return (
      <ProfileSectionShell id="services" label="Service requests">
        <div className="hairline-border bg-concrete p-6 mt-4 sm:p-8">
          <p className="eyebrow text-clay">Unable to load requests</p>
          <p className="type-infill mt-3">{error}</p>
          <button
            type="button"
            className="action-primary mt-6"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </ProfileSectionShell>
    );
  }

  if (!data?.length) {
    return (
      <div id="services" className="scroll-mt-28 lg:scroll-mt-32">
        <ProfileEmptyState
          title="No service requests on this sheet yet"
          message="Design and research briefs from Services, plus device access requests from your profile, will appear here."
          actionHref="/services"
          actionLabel="Open services"
        />
      </div>
    );
  }

  return (
    <ProfileSectionShell id="services" label="Service requests">
      <p className="type-infill mt-2 mb-4 text-charcoal-infill">
        {data.length} brief{data.length === 1 ? "" : "s"} filed with the studio.
      </p>

      <ul className="space-y-px bg-hairline">
        {data.map((request) => {
          const isOpen = expandedId === request.id;

          return (
            <li key={request.id} className="bg-concrete">
              <button
                type="button"
                className="flex w-full flex-col gap-4 p-6 text-left transition-colors duration-200 hover:bg-concrete-dark/30 sm:flex-row sm:items-center sm:justify-between sm:p-8"
                onClick={() =>
                  setExpandedId((current) =>
                    current === request.id ? null : request.id
                  )
                }
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <p className="label-caps mb-2 text-charcoal-infill">
                    Submitted {formatSubmitted(request)}
                  </p>
                  <h3 className="type-title text-xl capitalize sm:text-2xl">
                    {request.type}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={request.status} />
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
                <div className="space-y-6 border-t border-hairline px-6 pb-8 pt-6 sm:px-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="label-caps mb-2">Contact</p>
                      <p className="type-infill">
                        {request.name}
                        <span className="text-charcoal/30"> · </span>
                        {request.email}
                      </p>
                    </div>
                    <div>
                      <p className="label-caps mb-2">Status</p>
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                  <div>
                    <p className="label-caps mb-2">Submitted details</p>
                    <p className="type-body whitespace-pre-wrap">
                      {detailText(request)}
                    </p>
                  </div>
                  {request.notes && (
                    <div className="border-t border-hairline pt-6">
                      <p className="label-caps mb-2">Studio notes</p>
                      <p className="type-infill whitespace-pre-wrap">
                        {request.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ProfileSectionShell>
  );
}

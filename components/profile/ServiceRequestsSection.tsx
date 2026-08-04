"use client";

import { useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { useAdminResource } from "@/hooks/useAdminResource";
import { listMyServiceRequests } from "@/lib/api/services";
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
  const { data, isLoading, error, refetch } =
    useAdminResource(listMyServiceRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <AdminLoader label="Loading service requests" />;
  }

  if (error) {
    return (
      <ThresholdFrame label="SERVICE REQUESTS" labelAsHeading>
        <div className="hairline-border bg-concrete p-8">
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
      </ThresholdFrame>
    );
  }

  if (!data?.length) {
    return (
      <ProfileEmptyState
        title="No service requests on this sheet yet"
        message="Design and research commission briefs will appear here after you submit from the services bay."
        actionHref="/services"
        actionLabel="Open services"
      />
    );
  }

  return (
    <ThresholdFrame label="SERVICE REQUESTS" labelAsHeading>
      <ul className="mt-4 space-y-px bg-hairline">
        {data.map((request) => {
          const isOpen = expandedId === request.id;

          return (
            <li key={request.id} className="bg-concrete">
              <button
                type="button"
                className="w-full text-left p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:bg-concrete-dark/30 transition-colors duration-200"
                onClick={() =>
                  setExpandedId((current) =>
                    current === request.id ? null : request.id
                  )
                }
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <p className="label-caps text-charcoal-infill mb-2">
                    Submitted {formatSubmitted(request)}
                  </p>
                  <h3 className="type-title text-xl capitalize">
                    {request.type}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusBadge status={request.status} />
                  <span className="label-caps text-charcoal-infill">
                    {isOpen ? "Collapse" : "Details"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="px-6 sm:px-8 pb-8 space-y-6 hairline-t">
                  <div>
                    <p className="label-caps mb-2">Contact</p>
                    <p className="type-infill">
                      {request.name} · {request.email}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps mb-2">Submitted details</p>
                    <p className="type-body whitespace-pre-wrap">
                      {detailText(request)}
                    </p>
                  </div>
                  {request.notes && (
                    <div>
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
    </ThresholdFrame>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import { updateServiceRequestStatus } from "@/lib/api/services";
import type { ServiceRequest, ServiceStatus } from "@/lib/api/types";

interface ServiceDetailPageProps {
  id: string;
}

const statusOptions: ServiceStatus[] = [
  "pending",
  "in review",
  "accepted",
  "rejected",
];

export function ServiceDetailPage({ id }: ServiceDetailPageProps) {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<ServiceRequest>(
        `/api/services/${id}`,
        "Fetching service request",
        onProgress
      ),
    [id]
  );
  const { data, setData, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading…");
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState<ServiceStatus>("pending");
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setNotes(data.notes ?? "");
    }
  }, [data]);

  async function persistStatus(nextStatus: ServiceStatus, nextNotes: string) {
    setIsSaving(true);
    setSaveError("");

    try {
      setData(await updateServiceRequestStatus(id, nextStatus, nextNotes));
      success("Status updated");
      setReviewOpen(false);
    } catch {
      const message = "We couldn't update the status. Please try again.";
      setSaveError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (status === "rejected" && !notes.trim()) {
      setSaveError("Add a reason before marking this request as rejected.");
      return;
    }
    await persistStatus(status, notes);
  }

  if (isLoading) {
    return (
      <AdminLoader
        label="Loading…"
        stepLabel={stepLabel}
        progress={progress}
        fullScreen
      />
    );
  }

  if (error || !data) {
    return (
      <AdminErrorState
        title="We couldn't open this request"
        message={
          error ||
          "This request may have been removed. Go back to the list and try again."
        }
        backHref="/admin/services"
        backLabel="Back to requests"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Service request"
        title={data.name}
        description="Review what the person sent, then update the status."
        action={
          <Link href="/admin/services" className="admin-btn admin-btn-secondary">
            Back to queue
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <ThresholdFrame label="SUBMISSION">
          <div className="hairline-border bg-concrete p-6 space-y-6">
            <div>
              <p className="label-caps mb-2">Contact</p>
              <p className="type-infill">
                {data.name} · {data.email}
              </p>
            </div>
            <div>
              <p className="label-caps mb-2">Type</p>
              <p className="type-title">{data.type}</p>
            </div>
            <div>
              <p className="label-caps mb-2">Submitted details</p>
              <p className="type-body whitespace-pre-wrap">
                {data.details ?? data.message ?? "No details submitted."}
              </p>
            </div>
            {data.referenceImageUrls && data.referenceImageUrls.length > 0 && (
              <div>
                <p className="label-caps mb-2">Reference images</p>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.referenceImageUrls.map((url, index) => (
                    <li key={`${url}-${index}`}>
                      <div className="relative aspect-[4/3] hairline-border bg-concrete-dark">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Reference image ${index + 1}`}
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.type === "device access" && (
              <div className="hairline-t pt-6">
                <p className="type-infill mb-4">
                  To fulfill this request, open the student account and either
                  remove a registered device or raise their device limit.
                </p>
                <Link
                  href={`/admin/users/${encodeURIComponent(data.email)}/edit`}
                  className="admin-btn admin-btn-secondary"
                >
                  Open student account
                </Link>
              </div>
            )}
          </div>
        </ThresholdFrame>

        <ThresholdFrame label="REVIEW STATUS">
          <div className="hairline-border bg-concrete p-6 space-y-6">
            <div>
              <p className="label-caps mb-2">Current status</p>
              <StatusBadge status={data.status} />
            </div>

            {saveError && (
              <p className="type-infill text-clay" role="alert">
                {saveError}
              </p>
            )}

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setStatus(data.status);
                setNotes(data.notes ?? "");
                setSaveError("");
                setReviewOpen(true);
              }}
              disabled={isSaving}
            >
              Update status and notes
            </button>
          </div>
        </ThresholdFrame>
      </div>

      <AdminEditModal
        open={reviewOpen}
        title="Update service request"
        context={data.name}
        description="Choose a status and add internal notes. Rejected requests require a clear reason."
        saveLabel="Save review"
        isSaving={isSaving}
        isDirty={status !== data.status || notes !== (data.notes ?? "")}
        onCancel={() => setReviewOpen(false)}
        onSave={() => void handleSave()}
      >
        <div className="space-y-5">
          <FormField
            id="service-status"
            name="service-status"
            label="New status"
            type="select"
            value={status}
            options={statusOptions.map((value) => ({
              label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
              value,
            }))}
            onChange={(value) => setStatus(value as ServiceStatus)}
          />
          <FormField
            id="service-notes"
            name="service-notes"
            label={status === "rejected" ? "Rejection reason" : "Internal notes"}
            type="textarea"
            value={notes}
            required={status === "rejected"}
            onChange={setNotes}
          />
          {saveError && <p className="type-infill text-clay" role="alert">{saveError}</p>}
        </div>
      </AdminEditModal>
    </div>
  );
}

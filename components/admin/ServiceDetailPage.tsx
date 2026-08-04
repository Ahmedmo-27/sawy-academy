"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import {
  getServiceRequest,
  updateServiceRequestStatus,
} from "@/lib/api/services";
import type { ServiceStatus } from "@/lib/api/types";

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
  const loader = useCallback(() => getServiceRequest(id), [id]);
  const { data, setData, isLoading, error, refetch } = useAdminResource(loader);
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState<ServiceStatus>("pending");
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

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
      setRejectOpen(false);
    } catch {
      const message = "We couldn't update the status. Please try again.";
      setSaveError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (status === "rejected") {
      setRejectOpen(true);
      return;
    }
    await persistStatus(status, notes);
  }

  async function handleRejectConfirm(reason?: string) {
    if (!reason?.trim()) return;
    setNotes(reason);
    await persistStatus("rejected", reason);
  }

  if (isLoading) return <AdminLoader label="Loading…" />;

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
          </div>
        </ThresholdFrame>

        <ThresholdFrame label="REVIEW STATUS">
          <div className="hairline-border bg-concrete p-6 space-y-6">
            <div>
              <p className="label-caps mb-2">Current status</p>
              <StatusBadge status={data.status} />
            </div>

            <FormField
              id="service-status"
              name="service-status"
              label="New status"
              type="select"
              value={status}
              options={statusOptions.map((value) => ({ label: value, value }))}
              onChange={(value) => setStatus(value as ServiceStatus)}
            />

            <FormField
              id="service-notes"
              name="service-notes"
              label="Notes"
              type="textarea"
              value={notes}
              onChange={setNotes}
            />

            {saveError && (
              <p className="type-infill text-clay" role="alert">
                {saveError}
              </p>
            )}

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? "Saving" : "Update status"}
            </button>
          </div>
        </ThresholdFrame>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject this request?"
        message="A reason is required before marking this request as rejected."
        confirmLabel="Reject request"
        isBusy={isSaving}
        reasonRequired
        reasonLabel="Rejection reason"
        reasonDefault={notes}
        reasonPlaceholder="Explain why this request was rejected…"
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => void handleRejectConfirm(reason)}
      />
    </div>
  );
}

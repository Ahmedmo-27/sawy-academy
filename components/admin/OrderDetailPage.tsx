"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { approveOrder, getOrder, rejectOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";

interface OrderDetailPageProps {
  id: string;
}

function screenshotUrl(order: Order) {
  return order.paymentScreenshotUrl ?? order.instaPayScreenshot ?? "";
}

export function OrderDetailPage({ id }: OrderDetailPageProps) {
  const loader = useCallback(() => getOrder(id), [id]);
  const { data: order, setData, isLoading, error, refetch } = useAdminResource(loader);
  const { success, error: toastError, neutral } = useToast();
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  async function handleApprove() {
    setIsSaving(true);
    setActionError("");

    try {
      setData(await approveOrder(id));
      success("Order approved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to approve order.";
      setActionError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReject(reason?: string) {
    if (!reason?.trim()) return;

    setIsSaving(true);
    setActionError("");

    try {
      setData(await rejectOrder(id, reason));
      setRejectOpen(false);
      neutral("Order rejected");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reject order.";
      setActionError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <AdminLoader label="Loading order…" />;

  if (error || !order) {
    return (
      <AdminErrorState
        title="We couldn't open this order"
        message={
          error
            ? "Please go back to the order list and try again."
            : "This order may have been removed."
        }
        backHref="/admin/orders"
        backLabel="Back to orders"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Payment verification"
        title={`Order ${order.id}`}
        description="Check the payment photo and amount, then approve or reject."
        action={
          <Link href="/admin/orders" className="admin-btn admin-btn-secondary">
            Back to queue
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <ThresholdFrame label="INSTAPAY SCREENSHOT">
          <div className="hairline-border bg-concrete p-6">
            {screenshotUrl(order) ? (
              <ImageFrame>
                <div className="relative min-h-[28rem] bg-concrete-dark">
                  <Image
                    src={screenshotUrl(order)}
                    alt="Uploaded InstaPay payment screenshot"
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain"
                  />
                </div>
              </ImageFrame>
            ) : (
              <div className="bg-concrete-dark/40 p-10 text-center">
                  <p className="eyebrow text-clay">No payment screenshot</p>
                  <p className="type-infill mt-3">
                    The student did not upload a payment photo with this order.
                  </p>
              </div>
            )}
          </div>
        </ThresholdFrame>

        <ThresholdFrame label="ORDER STATUS">
          <div className="hairline-border bg-concrete p-6 space-y-6">
            <div>
              <p className="label-caps mb-2">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="label-caps mb-2">Amount</p>
              <p className="type-title">{String(order.amount)}</p>
            </div>
            <div>
              <p className="label-caps mb-2">Submitted</p>
              <p className="type-infill">
                {order.submittedAt ?? order.createdAt ?? "Not recorded"}
              </p>
            </div>
            <div>
              <p className="label-caps mb-2">Student</p>
              <p className="type-infill">
                {order.userName ?? "Unknown"} · {order.userEmail ?? "No email"}
              </p>
            </div>

            {order.reason && (
              <div>
                <p className="label-caps mb-2">Rejection reason</p>
                <p className="type-infill whitespace-pre-wrap">
                  {order.reason}
                </p>
              </div>
            )}

            {actionError && (
              <p className="type-infill text-clay" role="alert">
                {actionError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => void handleApprove()}
                disabled={isSaving}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setRejectOpen(true)}
                disabled={isSaving}
              >
                Reject
              </button>
            </div>
          </div>
        </ThresholdFrame>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject this order?"
        message="The student will see this decision. A reason is required."
        confirmLabel="Reject order"
        isBusy={isSaving}
        reasonRequired
        reasonLabel="Rejection reason"
        reasonPlaceholder="Explain why this payment was rejected…"
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => void handleReject(reason)}
      />
    </div>
  );
}

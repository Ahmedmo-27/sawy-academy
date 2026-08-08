"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/components/feedback/ToastProvider";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAdminResource } from "@/hooks/useAdminResource";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import {
  listUserDevicesAdmin,
  removeUserDeviceAdmin,
  type RegisteredDevice,
} from "@/lib/api/devices";
import type {
  HlsKeyAccessLog,
  VideoAccessFlagDetail,
  VideoAccessFlagStatus,
} from "@/lib/api/types";
import {
  getVideoAccessFlag,
  revokeUserSessionsAdmin,
  updateVideoAccessFlag,
} from "@/lib/api/videoAccessFlags";

interface DetailData extends VideoAccessFlagDetail {
  devices: RegisteredDevice[];
}

const reviewStates: VideoAccessFlagStatus[] = [
  "open",
  "in_review",
  "resolved",
  "dismissed",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function VideoAccessFlagDetailPage({ id }: { id: string }) {
  const loader = useCallback(async () => {
    const detail = await getVideoAccessFlag(id, 100);
    const devices = await listUserDevicesAdmin(detail.flag.userId._id);
    return { ...detail, devices: devices.devices };
  }, [id]);
  const { data, setData, isLoading, error, refetch } =
    useAdminResource<DetailData>(loader, "Loading access review");
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState<VideoAccessFlagStatus>("open");
  const [notes, setNotes] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"sessions" | "device" | null>(
    null
  );
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!data) return;
    setStatus(data.flag.status);
    setNotes(data.flag.notes || "");
    setSelectedDeviceId((current) =>
      data.devices.some((device) => device.id === current)
        ? current
        : data.devices[0]?.id || ""
    );
  }, [data]);

  async function saveReview() {
    if (!data) return;
    setIsWorking(true);
    try {
      const flag = await updateVideoAccessFlag(id, { status, notes });
      setData({ ...data, flag });
      success("Review updated");
      setReviewOpen(false);
    } catch (err) {
      toastError(toFriendlyAdminError(err, "update this review"));
    } finally {
      setIsWorking(false);
    }
  }

  async function confirmAdminAction() {
    if (!data || !confirmAction) return;
    setIsWorking(true);
    try {
      if (confirmAction === "sessions") {
        const result = await revokeUserSessionsAdmin(data.flag.userId._id);
        success(`${result.revokedCount} active session(s) revoked`);
      } else {
        const target = data.devices.find(
          (device) => device.id === selectedDeviceId
        );
        if (!target) return;
        await removeUserDeviceAdmin(data.flag.userId._id, target.id);
        const devices = data.devices.filter((device) => device.id !== target.id);
        setData({ ...data, devices });
        success(`${target.label} removed`);
      }
      setConfirmAction(null);
    } catch (err) {
      toastError(toFriendlyAdminError(err, "complete this account action"));
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return <AdminLoader label="Loading access review" fullScreen />;
  }
  if (error || !data) {
    return (
      <AdminErrorState
        title="This viewing alert could not be opened"
        message={error || "The alert may no longer exist."}
        backHref="/admin/video-access-flags"
        backLabel="Back to alerts"
        onRetry={() => void refetch()}
      />
    );
  }

  const { flag, logs, devices } = data;
  const logColumns: DataTableColumn<HlsKeyAccessLog>[] = [
    {
      key: "time",
      header: "Time",
      sortable: true,
      render: (log) => formatDate(log.occurredAt),
      sortValue: (log) => log.occurredAt,
    },
    { key: "ip", header: "Network address", render: (log) => log.ip },
    {
      key: "outcome",
      header: "Result",
      render: (log) => (
        <span>
          <StatusBadge status={log.outcome} />
          <span className="mt-1 block type-infill">{log.reason}</span>
        </span>
      ),
    },
    {
      key: "lesson",
      header: "Lesson",
      render: (log) => log.lessonId?.title || "Unknown",
    },
    {
      key: "agent",
      header: "Browser and device",
      className: "max-w-sm break-words",
      render: (log) => log.userAgent || "Unknown",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Video viewing alert"
        title={flag.userId.name}
        description={`${flag.userId.email} · ${flag.lessonId.title}`}
        action={
          <Link
            href="/admin/video-access-flags"
            className="admin-btn admin-btn-secondary"
          >
            Back to flags
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <ThresholdFrame label="DETECTION">
          <div className="hairline-border space-y-5 bg-concrete p-6">
            <div>
              <p className="label-caps mb-2">Current state</p>
              <StatusBadge status={flag.status.replace("_", " ")} />
            </div>
            <p className="type-body">
              Activity came from {flag.distinctIpCount} different network
              locations. The alert limit is {flag.threshold} locations within{" "}
              {flag.windowMinutes} minutes.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="label-caps">First detected</dt>
                <dd className="type-infill mt-1">
                  {formatDate(flag.firstDetectedAt)}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Last detected</dt>
                <dd className="type-infill mt-1">
                  {formatDate(flag.lastDetectedAt)}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Detected device</dt>
                <dd className="type-infill mt-1 break-all">{flag.deviceId}</dd>
              </div>
              <div>
                <dt className="label-caps">Why this was flagged</dt>
                <dd className="type-infill mt-1">Too many network locations in a short time</dd>
              </div>
            </dl>
          </div>
        </ThresholdFrame>

        <ThresholdFrame label="REVIEW">
          <div className="hairline-border space-y-5 bg-concrete p-6">
            <div>
              <p className="label-caps mb-2">Review state</p>
              <StatusBadge status={flag.status.replace("_", " ")} />
            </div>
            <div>
              <p className="label-caps mb-2">Admin notes</p>
              <p className="type-infill whitespace-pre-wrap text-charcoal-muted">
                {flag.notes || "No review notes yet."}
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={isWorking}
              onClick={() => {
                setStatus(flag.status);
                setNotes(flag.notes || "");
                setReviewOpen(true);
              }}
            >
              Edit review
            </button>
          </div>
        </ThresholdFrame>
      </div>

      <AdminEditModal
        open={reviewOpen}
        title="Update access review"
        context={flag.userId.name}
        description="Change the review state and record why the decision was made."
        saveLabel="Save review"
        isSaving={isWorking}
        isDirty={status !== flag.status || notes !== (flag.notes || "")}
        onCancel={() => setReviewOpen(false)}
        onSave={() => void saveReview()}
      >
        <div className="space-y-5">
          <label className="block">
            <span className="label-caps mb-2 block">Review state</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VideoAccessFlagStatus)
              }
              className="w-full border border-hairline bg-concrete px-3 py-3"
            >
              {reviewStates.map((state) => (
                <option key={state} value={state}>
                  {state.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-caps mb-2 block">Admin notes</span>
            <textarea
              rows={6}
              maxLength={5000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-y border border-hairline bg-concrete px-3 py-3"
            />
          </label>
        </div>
      </AdminEditModal>

      <ThresholdFrame label="ACCOUNT ACTIONS">
        <div className="hairline-border space-y-6 bg-concrete p-6">
          <p className="type-infill">
            An alert does not block a user. Use these actions only after
            review.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => setConfirmAction("sessions")}
            >
              Sign out on every device
            </button>
          </div>
          <div className="hairline-t pt-5">
            <label className="block max-w-xl">
              <span className="label-caps mb-2 block">
                Registered device to remove
              </span>
              <select
                value={selectedDeviceId}
                disabled={devices.length === 0}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="w-full border border-hairline bg-concrete px-3 py-3"
              >
                {devices.length === 0 && <option value="">No devices</option>}
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label} · last active {formatDate(device.lastActiveAt)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="admin-btn admin-btn-danger mt-3"
              disabled={!selectedDeviceId}
              onClick={() => setConfirmAction("device")}
            >
              Remove selected device
            </button>
          </div>
        </div>
      </ThresholdFrame>

      <ThresholdFrame label="RECENT VIEWING ATTEMPTS">
        <div className="hairline-border bg-concrete p-4">
          <DataTable
            data={logs}
            columns={logColumns}
            getRowKey={(log) => log._id}
            pageSize={10}
            emptyMessage="No recent viewing attempts are available."
            searchPlaceholder="Search network address, result, lesson, browser, or device"
            getSearchText={(log) =>
              [
                log.ip,
                log.outcome,
                log.reason,
                log.lessonId?.title,
                log.userAgent,
              ].join(" ")
            }
          />
        </div>
      </ThresholdFrame>

      <ConfirmDialog
        open={confirmAction === "sessions"}
        title="Sign out on every device?"
        message="The user will be signed out everywhere. This does not block the account."
        confirmLabel="Sign out user"
        isBusy={isWorking}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirmAdminAction()}
      />
      <ConfirmDialog
        open={confirmAction === "device"}
        title="Remove selected device?"
        message="The selected device will be removed and signed out. The user can register it again later."
        confirmLabel="Remove device"
        isBusy={isWorking}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirmAdminAction()}
      />
    </div>
  );
}

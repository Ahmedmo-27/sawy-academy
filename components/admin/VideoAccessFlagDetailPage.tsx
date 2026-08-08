"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
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
        title="This access flag could not be opened"
        message={error || "The flag may no longer exist."}
        backHref="/admin/video-access-flags"
        backLabel="Back to flags"
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
    { key: "ip", header: "IP", render: (log) => log.ip },
    {
      key: "outcome",
      header: "Outcome",
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
      header: "User agent",
      className: "max-w-sm break-words",
      render: (log) => log.userAgent || "Unknown",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Video access review"
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
              {flag.distinctIpCount} distinct IPs observed against a threshold
              of {flag.threshold} in {flag.windowMinutes} minutes.
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
                <dt className="label-caps">Device ID</dt>
                <dd className="type-infill mt-1 break-all">{flag.deviceId}</dd>
              </div>
              <div>
                <dt className="label-caps">Rule</dt>
                <dd className="type-infill mt-1">Distinct IP threshold</dd>
              </div>
            </dl>
          </div>
        </ThresholdFrame>

        <ThresholdFrame label="REVIEW">
          <div className="hairline-border space-y-5 bg-concrete p-6">
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
                rows={5}
                maxLength={5000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full resize-y border border-hairline bg-concrete px-3 py-3"
              />
            </label>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={isWorking}
              onClick={() => void saveReview()}
            >
              Save review
            </button>
          </div>
        </ThresholdFrame>
      </div>

      <ThresholdFrame label="ACCOUNT ACTIONS">
        <div className="hairline-border space-y-6 bg-concrete p-6">
          <p className="type-infill">
            A flag does not ban a user. Use these explicit actions only after
            review.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => setConfirmAction("sessions")}
            >
              Revoke all active sessions
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

      <ThresholdFrame label="RECENT KEY ATTEMPTS">
        <div className="hairline-border bg-concrete p-4">
          <DataTable
            data={logs}
            columns={logColumns}
            getRowKey={(log) => log._id}
            pageSize={10}
            emptyMessage="No retained key attempts are available."
            searchPlaceholder="Search IP, outcome, lesson, or user agent"
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
        title="Revoke all active sessions?"
        message="The user will be signed out on every device. This does not ban the account."
        confirmLabel="Revoke sessions"
        isBusy={isWorking}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirmAdminAction()}
      />
      <ConfirmDialog
        open={confirmAction === "device"}
        title="Remove selected device?"
        message="The selected registration and its active sessions will be removed. The user can register a device again later."
        confirmLabel="Remove device"
        isBusy={isWorking}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirmAdminAction()}
      />
    </div>
  );
}

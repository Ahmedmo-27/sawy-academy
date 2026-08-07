"use client";

import { useCallback, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import {
  removeUserDeviceAdmin,
  type RegisteredDevice,
} from "@/lib/api/devices";

function formatLastActive(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface UserDevicesPanelProps {
  userId: string;
}

export function UserDevicesPanel({ userId }: UserDevicesPanelProps) {
  const { success, error: toastError } = useToast();
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<{
        userId: string;
        devices: RegisteredDevice[];
        deviceLimit: number;
      }>(
        `/api/admin/users/${encodeURIComponent(userId)}/devices`,
        "Fetching registered devices",
        onProgress
      ),
    [userId]
  );
  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading registered devices");
  const [removeTarget, setRemoveTarget] = useState<RegisteredDevice | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const columns: DataTableColumn<RegisteredDevice>[] = [
    {
      key: "label",
      header: "Device",
      render: (row) => row.label,
      sortValue: (row) => row.label,
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      render: (row) => formatLastActive(row.lastActiveAt),
      sortValue: (row) => row.lastActiveAt,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={() => setRemoveTarget(row)}
        >
          Remove
        </button>
      ),
    },
  ];

  async function confirmRemove() {
    if (!removeTarget) return;

    setIsRemoving(true);
    try {
      await removeUserDeviceAdmin(userId, removeTarget.id);
      success("Device removed");
      setRemoveTarget(null);
      await refetch();
    } catch (err) {
      toastError(toFriendlyAdminError(err, "remove this device"));
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return (
      <AdminLoader
        label="Loading registered devices"
        stepLabel={stepLabel}
        progress={progress}
      />
    );
  }

  if (error) {
    return (
      <div className="hairline-border bg-concrete p-6 lg:p-8">
        <p className="eyebrow text-clay">Unable to load devices</p>
        <p className="type-infill mt-3">{error}</p>
        <button
          type="button"
          className="admin-btn admin-btn-secondary mt-6"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const devices = data?.devices ?? [];
  const deviceLimit = data?.deviceLimit ?? 2;

  return (
    <>
      <div className="hairline-border bg-concrete p-6 lg:p-8">
        <p className="label-caps mb-2 text-clay">
          Registered devices ({devices.length}/{deviceLimit})
        </p>
        <p className="type-infill mb-4 text-charcoal-infill">
          Students cannot remove devices themselves. Remove a device here to
          free a slot, or raise the device limit in the user form above.
        </p>
        <DataTable
          data={devices}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyMessage="No devices registered for this account yet."
          pageSize={5}
        />
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={`Remove ${removeTarget?.label ?? "device"}?`}
        message="The student will be signed out on that device and can register a new one on their next login."
        confirmLabel="Remove device"
        isBusy={isRemoving}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => void confirmRemove()}
      />
    </>
  );
}

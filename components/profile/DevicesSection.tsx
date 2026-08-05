"use client";

import { useCallback, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { ApiClientError } from "@/lib/api/client";
import {
  listMyDevices,
  removeMyDevice,
  type RegisteredDevice,
} from "@/lib/api/devices";
import { getStoredDeviceId } from "@/lib/device/id";

function formatLastActive(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DevicesSection() {
  const { success } = useToast();
  const loader = useCallback(() => listMyDevices(), []);
  const { data, isLoading, error, refetch } = useAdminResource(loader);
  const [removeTarget, setRemoveTarget] = useState<RegisteredDevice | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [actionError, setActionError] = useState("");

  const currentDeviceId =
    data?.currentDeviceId || getStoredDeviceId() || "";

  async function confirmRemove() {
    if (!removeTarget) return;

    setIsRemoving(true);
    setActionError("");
    try {
      await removeMyDevice(removeTarget.id);
      setRemoveTarget(null);
      success("Device removed");
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to remove device."
      );
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return <AdminLoader label="Loading registered devices" />;
  }

  if (error) {
    return (
      <ThresholdFrame label="REGISTERED DEVICES" labelAsHeading>
        <div className="hairline-border bg-concrete p-8">
          <p className="eyebrow text-clay">Unable to load devices</p>
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

  const devices = data?.devices ?? [];

  if (!devices.length) {
    return (
      <ProfileEmptyState
        title="No registered devices yet"
        message="Devices are recorded when you sign in. Your current browser will appear here after your next login."
      />
    );
  }

  return (
    <ThresholdFrame label="REGISTERED DEVICES" labelAsHeading>
      <div className="hairline-border mt-4 bg-concrete/80">
        <div className="p-8 hairline-b">
          <p className="eyebrow text-clay mb-2">Device access</p>
          <p className="type-infill max-w-xl">
            Student accounts may stay signed in on up to two devices. Remove a
            device you no longer use to free a slot for a new browser or phone.
          </p>
        </div>

        <ul className="divide-y divide-hairline">
          {devices.map((device) => {
            const isCurrent = device.id === currentDeviceId;

            return (
              <li
                key={device.id}
                className="p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="type-heading text-base">{device.label}</p>
                    {isCurrent && (
                      <span className="label-caps text-clay">This device</span>
                    )}
                  </div>
                  <p className="type-infill mt-2">
                    Last active {formatLastActive(device.lastActiveAt)}
                  </p>
                </div>

                {isCurrent ? (
                  <p className="type-infill text-charcoal-muted">
                    Sign in on another device to remove this one.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="action-secondary shrink-0"
                    onClick={() => {
                      setActionError("");
                      setRemoveTarget(device);
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {actionError && (
          <p className="type-body text-clay px-8 pb-8" role="alert">
            {actionError}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove this device?"
        message="You'll need to log in again on it. This frees a slot for another browser or phone."
        confirmLabel="Remove device"
        cancelLabel="Cancel"
        variant="public"
        confirmTone="danger"
        isBusy={isRemoving}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => void confirmRemove()}
      />
    </ThresholdFrame>
  );
}

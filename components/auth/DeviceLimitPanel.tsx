"use client";

import { useState } from "react";
import type { RegisteredDevice } from "@/lib/api/devices";
import { removeDeviceBeforeLogin } from "@/lib/api/devices";

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

interface DeviceLimitPanelProps {
  devices: RegisteredDevice[];
  email: string;
  password: string;
  onRetryLogin: () => Promise<void>;
}

export function DeviceLimitPanel({
  devices,
  email,
  password,
  onRetryLogin,
}: DeviceLimitPanelProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleRemove(deviceId: string) {
    setError("");
    setRemovingId(deviceId);
    try {
      await removeDeviceBeforeLogin({ deviceId, email, password });
      await onRetryLogin();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove that device. Try again."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="hairline-border p-6 lg:p-8 mb-6 bg-concrete/90">
      <div className="hairline-b pb-4 mb-4">
        <p className="eyebrow text-clay mb-2">Device limit reached</p>
        <p className="type-body">
          This account is already signed in on two devices. Remove one below to
          sign in on this browser instead.
        </p>
      </div>

      <ul className="space-y-4">
        {devices.map((device) => (
          <li
            key={device.id}
            className="hairline-border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="type-heading text-base">{device.label}</p>
              <p className="type-infill mt-1">
                Last active {formatLastActive(device.lastActiveAt)}
              </p>
            </div>
            <button
              type="button"
              className="action-secondary shrink-0"
              disabled={Boolean(removingId)}
              onClick={() => void handleRemove(device.id)}
            >
              {removingId === device.id
                ? "Removing…"
                : "Remove this device and sign in here instead"}
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="type-body text-clay mt-4" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import type { RegisteredDevice } from "@/lib/api/devices";

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
}

export function DeviceLimitPanel({ devices }: DeviceLimitPanelProps) {
  return (
    <div className="hairline-border p-6 lg:p-8 mb-6 bg-concrete/90">
      <div className="hairline-b pb-4 mb-4">
        <p className="eyebrow text-clay mb-2">Device limit reached</p>
        <p className="type-body">
          This account has reached its device limit. You cannot remove devices
          yourself. Sign in on a registered device and submit a device access
          request from your profile, or contact an administrator.
        </p>
      </div>

      {devices.length > 0 && (
        <ul className="space-y-4">
          {devices.map((device) => (
            <li key={device.id} className="hairline-border p-4">
              <p className="type-heading text-base">{device.label}</p>
              <p className="type-infill mt-1">
                Last active {formatLastActive(device.lastActiveAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

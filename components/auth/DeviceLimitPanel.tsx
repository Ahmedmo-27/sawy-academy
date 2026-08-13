"use client";

import Link from "next/link";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
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
  email?: string;
}

/**
 * Shown on login/signup when DEVICE_LIMIT_REACHED.
 * Device replace/increase can only be requested from a logged-in session
 * on a registered device (profile), and only takes effect after admin approval.
 */
export function DeviceLimitPanel({
  devices,
  email = "",
}: DeviceLimitPanelProps) {
  const { branding } = useSiteSettings();
  const contactEmail = branding.email || "info@sawyacademy.eg";
  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "Device access help"
  )}&body=${encodeURIComponent(
    `I reached the device limit (2 devices) for ${email || "my account"} and cannot sign in on this browser. Please help after I submit a request from a registered device, or advise on next steps.`
  )}`;

  return (
    <div className="hairline-border p-6 lg:p-8 mb-6 bg-concrete/90">
      <div className="hairline-b pb-4 mb-4">
        <p className="eyebrow text-clay mb-2">Device limit reached</p>
        <p className="type-body">
          This account allows 2 registered devices by default. You cannot add or
          replace a device from this screen. Sign in on a registered device,
          open your profile, and submit a device access request. An
          administrator must approve it before the change takes effect.
        </p>
      </div>

      {devices.length > 0 && (
        <ul className="space-y-4 mb-6">
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

      <ol className="type-infill mb-6 list-decimal space-y-2 pl-5 leading-relaxed">
        <li>Sign in on one of the registered devices listed above.</li>
        <li>
          Open your profile → Devices and request a replace or an extra slot.
        </li>
        <li>Wait for studio approval — the limit does not change until then.</li>
      </ol>

      <div className="flex flex-wrap gap-4 hairline-t pt-4">
        <Link
          href="/dashboard/profile"
          className="action-secondary"
        >
          Profile (when signed in)
        </Link>
        <a href={mailtoHref} className="action-secondary">
          Email studio
        </a>
        <Link href="/contact" className="action-secondary">
          Contact page
        </Link>
      </div>
    </div>
  );
}

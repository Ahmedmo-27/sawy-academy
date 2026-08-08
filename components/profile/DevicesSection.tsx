"use client";

import { FormEvent, useCallback, useState } from "react";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";
import {
  ProfileSectionError,
  ProfileSectionLoading,
} from "@/components/profile/ProfileSectionState";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { ApiClientError } from "@/lib/api/client";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import type { RegisteredDevice } from "@/lib/api/devices";
import { submitServiceRequest } from "@/lib/api/services";
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

type RequestKind = "replace" | "increase";

export function DevicesSection() {
  const { user } = useAuth();
  const { success } = useToast();
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<{
        devices: RegisteredDevice[];
        currentDeviceId: string;
        deviceLimit: number;
      }>("/api/devices/me", "Fetching registered devices", onProgress),
    []
  );
  const { data, isLoading, error, refetch } =
    useAdminResource(loader, "Loading registered devices");

  const [requestKind, setRequestKind] = useState<RequestKind>("replace");
  const [deviceToReplaceId, setDeviceToReplaceId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const currentDeviceId = data?.currentDeviceId || getStoredDeviceId() || "";
  const devices = data?.devices ?? [];
  const deviceLimit = data?.deviceLimit ?? 2;
  const slotsUsed = Math.min(devices.length, deviceLimit);
  const slotsFree = Math.max(0, deviceLimit - devices.length);
  const atLimit = devices.length >= deviceLimit;

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!user?.email) {
      setFormError("Sign in again to submit a device request.");
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setFormError("Explain why you need this change.");
      return;
    }

    if (requestKind === "replace" && !deviceToReplaceId) {
      setFormError("Select which device you want to replace.");
      return;
    }

    const target = devices.find((device) => device.id === deviceToReplaceId);

    setIsSubmitting(true);
    try {
      await submitServiceRequest({
        type: "device-access",
        name: user.name,
        email: user.email,
        requestKind,
        reason: trimmedReason,
        ...(requestKind === "replace"
          ? {
              deviceToReplaceId,
              deviceToReplaceLabel: target?.label,
            }
          : {}),
      });
      setReason("");
      setDeviceToReplaceId("");
      setFormSuccess(
        "Request submitted. An administrator will review it and make the change for you."
      );
      success("Device request submitted");
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to submit request."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <ProfileSectionLoading id="devices" label="Registered devices" />;
  }

  if (error) {
    return (
      <ProfileSectionError
        id="devices"
        label="Registered devices"
        title="Unable to load devices"
        message={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!devices.length) {
    return (
      <div id="devices" className="scroll-mt-28 lg:scroll-mt-32">
        <ProfileEmptyState
          title="No registered devices yet"
          message="Devices are recorded when you sign in. Your current browser will appear here after your next login."
        />
      </div>
    );
  }

  return (
    <ProfileSectionShell id="devices" label="Registered devices">
      <div className="hairline-border mt-4 bg-concrete/80">
        <div className="grid gap-6 border-b border-hairline p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-8">
          <div>
            <p className="eyebrow text-clay mb-2">Device access</p>
            <p className="type-infill max-w-xl">
              Student accounts may stay signed in on up to {deviceLimit} device
              {deviceLimit === 1 ? "" : "s"}. Only an administrator can remove a
              device or raise your limit after you submit a request.
            </p>
          </div>
          <div className="sm:text-right">
            <p className="label-caps mb-2 text-charcoal-infill">Slots</p>
            <p className="font-serif text-2xl italic tabular-nums">
              {slotsUsed}
              <span className="text-charcoal/30"> / </span>
              {deviceLimit}
            </p>
            <p className="type-infill mt-1 text-charcoal-infill">
              {slotsFree === 0
                ? "All slots in use"
                : `${slotsFree} slot${slotsFree === 1 ? "" : "s"} free`}
            </p>
          </div>
        </div>

        <div
          className="flex gap-2 border-b border-hairline px-6 py-4 sm:px-8"
          aria-hidden="true"
        >
          {Array.from({ length: deviceLimit }).map((_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 ${
                index < slotsUsed ? "bg-clay/50" : "bg-hairline"
              }`}
            />
          ))}
        </div>

        <ul className="divide-y divide-hairline">
          {devices.map((device) => {
            const isCurrent = device.id === currentDeviceId;

            return (
              <li
                key={device.id}
                className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
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
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hairline-border mt-px bg-concrete/80 p-6 sm:p-8">
        <p className="eyebrow text-clay mb-2">Request a change</p>
        <p className="type-infill mb-6 max-w-xl">
          Need to replace a phone or browser
          {atLimit ? ", or use an extra device" : ""}? Submit a request and an
          administrator will handle it for you.
        </p>

        <form className="space-y-6" onSubmit={handleRequestSubmit} noValidate>
          <fieldset>
            <legend className="label-caps mb-3">What do you need?</legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 type-infill">
                <input
                  type="radio"
                  name="device-request-kind"
                  value="replace"
                  checked={requestKind === "replace"}
                  onChange={() => setRequestKind("replace")}
                />
                Replace a registered device
              </label>
              <label className="flex items-center gap-2 type-infill">
                <input
                  type="radio"
                  name="device-request-kind"
                  value="increase"
                  checked={requestKind === "increase"}
                  onChange={() => setRequestKind("increase")}
                />
                Request an extra device slot
              </label>
            </div>
          </fieldset>

          {requestKind === "replace" && (
            <div>
              <label
                htmlFor="device-to-replace"
                className="label-caps mb-2 block"
              >
                Device to replace
                <span className="text-clay"> *</span>
              </label>
              <select
                id="device-to-replace"
                value={deviceToReplaceId}
                onChange={(event) => setDeviceToReplaceId(event.target.value)}
                className="w-full border-0 border-b border-hairline bg-transparent px-0 py-3 type-body text-charcoal focus-visible:border-clay"
                required
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                    {device.id === currentDeviceId ? " (this device)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="device-request-reason" className="label-caps mb-2 block">
              Reason
              <span className="text-clay"> *</span>
            </label>
            <textarea
              id="device-request-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full border border-hairline bg-transparent p-4 type-body text-charcoal focus-visible:border-clay"
              placeholder="e.g. I got a new phone and no longer use the old one."
              required
            />
          </div>

          {formError && (
            <p className="type-body text-clay" role="alert">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="type-body text-charcoal" role="status">
              {formSuccess}
            </p>
          )}

          <button
            type="submit"
            className="action-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit device request"}
          </button>
        </form>
      </div>
    </ProfileSectionShell>
  );
}

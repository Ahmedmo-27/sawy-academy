"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";
import { useAuth } from "@/hooks/useAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useToast } from "@/components/feedback/ToastProvider";
import { updateMe } from "@/lib/api/users";
import { uploadImage } from "@/lib/api/upload";
import { apiGet, ApiClientError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function avatarFrom(user: {
  avatarUrl?: string;
  photoUrl?: string;
} | null) {
  return user?.avatarUrl ?? user?.photoUrl ?? "";
}

function formatMemberSince(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function ProfileIdentityPanel() {
  const { updateSessionUser } = useAuth();
  const { success } = useToast();
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      apiGet<User>("/api/users/me", undefined, {
        onProgress: (value) => onProgress(value, "Loading identity sheet"),
      }),
    []
  );
  const { data, setData, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading identity sheet");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email);
    setAvatarUrl(avatarFrom(data));
    setSaveError("");
    setEmailError("");
  }, [data]);

  const baselineName = data?.name ?? "";
  const baselineEmail = data?.email ?? "";
  const baselineAvatar = avatarFrom(data);
  const isDirty =
    name.trim() !== baselineName ||
    email.trim() !== baselineEmail ||
    avatarUrl !== baselineAvatar;

  async function handlePhotoSelect(file?: File) {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const response = await uploadImage(file, {
        onProgress: setUploadProgress,
      });
      setAvatarUrl(response.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function validateEmail(value: string) {
    if (!value.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    if (!EMAIL_PATTERN.test(value.trim())) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaveError("");

    if (!validateEmail(email)) return;
    if (!name.trim()) {
      setSaveError("Name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateMe({
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl || undefined,
      });
      setData(updated);
      updateSessionUser({
        name: updated.name,
        email: updated.email,
      });
      success("Profile updated");
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to save profile.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div id="identity" className="scroll-mt-28 lg:scroll-mt-32">
        <AdminLoader
          label="Loading identity sheet"
          stepLabel={stepLabel}
          progress={progress}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ProfileSectionShell id="identity" label="Identity">
        <div className="hairline-border bg-concrete p-6 mt-4 sm:p-8">
          <p className="eyebrow text-clay">Unable to load profile</p>
          <p className="type-infill mt-3">{error || "Profile was not found."}</p>
          <button
            type="button"
            className="action-primary mt-6"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </ProfileSectionShell>
    );
  }

  return (
    <ProfileSectionShell id="identity" label="Drawing title block — Identity">
      <form
        onSubmit={(event) => void handleSave(event)}
        className="hairline-border mt-4 overflow-hidden bg-concrete/80"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-concrete-dark/35 px-6 py-4 sm:px-8">
          <div>
            <p className="eyebrow text-clay">Student register</p>
            <p className="type-infill mt-1 text-charcoal-infill">
              Edit your portrait and contact details, then save the sheet.
            </p>
          </div>
          <ScaleBar scale="1:100" className="max-w-[100px] opacity-70" />
        </div>

        <div className="grid grid-cols-1 gap-10 p-6 sm:p-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <div>
            <p className="label-caps mb-3">Portrait</p>
            <button
              type="button"
              className="group relative block w-full text-left"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              aria-describedby="profile-photo-hint"
            >
              <ImageFrame>
                <div className="relative aspect-[4/3] bg-concrete-dark sm:aspect-square lg:aspect-[4/5]">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Current profile photo"
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 13rem, 40vw"
                      className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <span className="font-serif text-3xl italic text-charcoal/25">
                        {initialsFrom(name || data.name)}
                      </span>
                      <p className="label-caps text-charcoal-infill">
                        Add photo
                      </p>
                    </div>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/55 to-transparent px-3 py-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="label-caps text-concrete">
                      Change photo
                    </span>
                  </span>
                </div>
              </ImageFrame>
            </button>
            <input
              ref={fileRef}
              id="profile-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload profile photo"
              onChange={(event) =>
                void handlePhotoSelect(event.target.files?.[0])
              }
            />
            <p
              id="profile-photo-hint"
              className="label-caps mt-3 text-charcoal-infill"
            >
              {isUploading
                ? "Uploading photo…"
                : "Click portrait to change. Image files only."}
            </p>
            {isUploading && (
              <ProcessProgressBar
                className="mt-3"
                compact
                stepLabel="Uploading photo"
                progress={uploadProgress}
              />
            )}
            {uploadError && (
              <p className="type-body text-clay mt-2" role="alert">
                {uploadError}
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="mb-8 hairline-b pb-6">
              <p className="label-caps mb-2 text-charcoal-infill">On sheet as</p>
              <p className="type-title font-serif text-2xl sm:text-3xl italic leading-tight">
                {name.trim() || data.name}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="profile-name" className="label-caps block mb-2">
                  Full name
                  <span className="text-clay"> *</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  required
                  aria-required="true"
                  className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="label-caps block mb-2">
                  Email
                  <span className="text-clay"> *</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) validateEmail(event.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? "profile-email-error" : undefined
                  }
                  className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
                />
                {emailError && (
                  <p
                    id="profile-email-error"
                    className="type-body text-clay mt-2"
                    role="alert"
                  >
                    {emailError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 hairline-t pt-6">
              <div>
                <p className="label-caps mb-2">Member since</p>
                <p className="type-infill font-serif italic">
                  {formatMemberSince(data.createdAt)}
                </p>
              </div>
              <div>
                <p className="label-caps mb-2">Sheet status</p>
                <p className="type-infill">
                  {isDirty ? "Unsaved edits" : "Current"}
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-6 pt-8">
              <button
                type="submit"
                className="cta-entrance"
                disabled={
                  !isDirty || isSaving || isUploading || Boolean(emailError)
                }
              >
                {isSaving ? "Saving…" : "Save profile"}
              </button>
              {isDirty && !isSaving && (
                <p className="type-infill text-charcoal-infill">
                  Changes pending on this sheet
                </p>
              )}
              {saveError && (
                <p className="type-body text-clay" role="alert">
                  {saveError}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </ProfileSectionShell>
  );
}

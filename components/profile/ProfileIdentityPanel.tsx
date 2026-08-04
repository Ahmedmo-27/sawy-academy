"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAuth } from "@/hooks/useAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useToast } from "@/components/feedback/ToastProvider";
import { getMe, updateMe } from "@/lib/api/users";
import { uploadImage } from "@/lib/api/upload";
import { ApiClientError } from "@/lib/api/client";

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

export function ProfileIdentityPanel() {
  const { updateSessionUser } = useAuth();
  const { success } = useToast();
  const { data, setData, isLoading, error, refetch } = useAdminResource(getMe);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    setUploadError("");

    try {
      const response = await uploadImage(file);
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
      // Match admin detail forms: await API, then replace local state from response.
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
    return <AdminLoader label="Loading identity sheet" />;
  }

  if (error || !data) {
    return (
      <ThresholdFrame label="IDENTITY">
        <div className="hairline-border bg-concrete p-8">
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
      </ThresholdFrame>
    );
  }

  return (
    <ThresholdFrame label="Drawing Title Block — Identity" labelAsHeading>
      <form
        onSubmit={(event) => void handleSave(event)}
        className="hairline-border p-8 mt-4 bg-concrete/80"
      >
        <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

        <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] gap-8 hairline-b pb-8 mb-8">
          <div>
            <p className="label-caps mb-3">Portrait</p>
            <button
              type="button"
              className="block w-full text-left"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              aria-describedby="profile-photo-hint"
            >
              <ImageFrame>
                <div className="relative aspect-square bg-concrete-dark">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Current profile photo"
                      fill
                      unoptimized
                      sizes="10rem"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                      <p className="label-caps text-charcoal-infill">Add photo</p>
                    </div>
                  )}
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
            <p id="profile-photo-hint" className="label-caps mt-3 text-charcoal-infill">
              {isUploading ? "Uploading…" : "Click to change. Image files only."}
            </p>
            {uploadError && (
              <p className="type-body text-clay mt-2" role="alert">
                {uploadError}
              </p>
            )}
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
                aria-describedby={emailError ? "profile-email-error" : undefined}
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
        </div>

        <div className="grid grid-cols-2 gap-6 hairline-b pb-8 mb-8">
          <div>
            <p className="label-caps mb-2">Member since</p>
            <p className="type-infill font-serif italic">
              {formatMemberSince(data.createdAt)}
            </p>
          </div>
          <div>
            <p className="label-caps mb-2">Scale</p>
            <p className="type-infill">1:100</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="submit"
            className="cta-entrance"
            disabled={!isDirty || isSaving || isUploading || Boolean(emailError)}
          >
            {isSaving ? "Saving…" : "Save profile"}
          </button>
          {saveError && (
            <p className="type-body text-clay" role="alert">
              {saveError}
            </p>
          )}
        </div>
      </form>
    </ThresholdFrame>
  );
}

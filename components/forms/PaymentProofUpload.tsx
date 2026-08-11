"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { uploadImage } from "@/lib/api/upload";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export function PaymentProofUpload({
  value,
  onChange,
  error,
  disabled = false,
}: {
  /** Stored payment proof key (`payments/...`) or local `/uploads/...` URL. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const displayedError = uploadError || error;

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function upload(file?: File) {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Choose an image smaller than 8 MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const localPreview = URL.createObjectURL(file);
      const result = await uploadImage(file, {
        onProgress: setProgress,
        purpose: "payment",
      });
      setPreviewUrl((previous) => {
        if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
        return result.storage === "local" ? result.url : localPreview;
      });
      onChange(result.objectKey || result.url);
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error ? uploadFailure.message : "Upload failed."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displaySrc =
    previewUrl ||
    (value.startsWith("/uploads/") || value.startsWith("http") ? value : "");

  return (
    <div>
      <label htmlFor={id} className="label-caps mb-2 block">
        InstaPay screenshot <span className="text-clay" aria-hidden="true">*</span>
      </label>
      <p id={descriptionId} className="type-infill mb-4 text-charcoal-muted">
        Upload a clear JPG, PNG, or WebP image of the payment confirmation, up
        to 8 MB.
      </p>

      <button
        type="button"
        className="block min-h-11 w-full hairline-border border-dashed bg-concrete-dark/30 p-6 text-left disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        aria-describedby={`${descriptionId}${displayedError ? ` ${errorId}` : ""}`}
      >
        {displaySrc ? (
          <span className="relative block aspect-[4/3]">
            <Image
              src={displaySrc}
              alt="Uploaded payment confirmation"
              fill
              unoptimized
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-contain"
            />
          </span>
        ) : (
          <span className="block py-8 text-center">
            <span className="eyebrow block text-clay">
              {uploading
                ? "Uploading…"
                : value
                  ? "Payment proof uploaded"
                  : "Choose payment proof"}
            </span>
            <span className="type-infill mt-3 block">Tap or click to select an image</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void upload(event.target.files?.[0])}
        disabled={disabled || uploading}
        aria-required="true"
        aria-invalid={Boolean(displayedError)}
        aria-describedby={`${descriptionId}${displayedError ? ` ${errorId}` : ""}`}
      />

      {uploading && (
        <ProcessProgressBar
          className="mt-3"
          compact
          stepLabel="Uploading payment proof"
          progress={progress}
        />
      )}
      {displayedError && (
        <p id={errorId} className="type-infill mt-3 text-clay" role="alert">
          {displayedError}
        </p>
      )}
    </div>
  );
}

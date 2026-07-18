"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { uploadImage } from "@/lib/api/upload";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional helper instructions announced with the control. */
  description?: string;
  error?: string;
  required?: boolean;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  description,
  error: externalError,
  required = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const labelId = useId();
  const descId = useId();
  const errorId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const error = externalError || uploadError;

  async function handleFile(file?: File) {
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await uploadImage(file);
      onChange(response.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label id={labelId} htmlFor={inputId} className="label-caps mb-2 block">
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>
      {description && (
        <p id={descId} className="type-infill mb-4 text-charcoal-muted">
          {description}
        </p>
      )}
      <button
        type="button"
        className="block w-full hairline-border border-dashed bg-concrete-dark/30 p-6 text-left transition-colors duration-200 hover:bg-concrete-dark/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files[0]);
        }}
        aria-labelledby={labelId}
        aria-describedby={
          [description ? descId : null, error ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        disabled={isUploading}
      >
        {value ? (
          <ImageFrame>
            <div className="relative aspect-[4/3] bg-concrete-dark">
              <Image
                src={value}
                alt={`Uploaded ${label}`}
                fill
                unoptimized
                sizes="(min-width: 1024px) 40rem, 100vw"
                className="object-cover"
              />
            </div>
          </ImageFrame>
        ) : (
          <div className="py-10 text-center">
            <p className="eyebrow text-clay">Drop image here</p>
            <p className="type-infill mt-3">
              Or click to choose a photo from your computer.
            </p>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={labelId}
        required={required && !value}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {isUploading && (
        <p className="label-caps mt-3 text-charcoal-muted loader-pulse" aria-live="polite">
          Uploading
        </p>
      )}
      {error && (
        <p id={errorId} className="type-infill mt-3 text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

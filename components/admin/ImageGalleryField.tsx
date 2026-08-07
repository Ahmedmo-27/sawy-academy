"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { uploadImage } from "@/lib/api/upload";

interface ImageGalleryFieldProps {
  label: string;
  /** JSON-encoded string[] stored in ResourceForm. */
  value: string;
  onChange: (value: string) => void;
  description?: string;
  error?: string;
  maxItems?: number;
}

function parseGallery(value: string): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

function serializeGallery(urls: string[]): string {
  return JSON.stringify(urls);
}

export function ImageGalleryField({
  label,
  value,
  onChange,
  description,
  error: externalError,
  maxItems = 12,
}: ImageGalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const labelId = useId();
  const descId = useId();
  const errorId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const items = parseGallery(value);
  const error = externalError || uploadError;
  const atLimit = items.length >= maxItems;

  async function handleFile(file?: File) {
    if (!file || atLimit) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const response = await uploadImage(file, {
        onProgress: setUploadProgress,
      });
      onChange(serializeGallery([...items, response.url]));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(serializeGallery(items.filter((_, i) => i !== index)));
  }

  function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(serializeGallery(copy));
  }

  return (
    <div>
      <label id={labelId} htmlFor={inputId} className="label-caps mb-2 block">
        {label}
      </label>
      {description && (
        <p id={descId} className="type-infill mb-4 text-charcoal-muted">
          {description}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((url, index) => (
            <li key={`${url}-${index}`} className="relative">
              <ImageFrame>
                <div className="relative aspect-[4/3] bg-concrete-dark">
                  <Image
                    src={url}
                    alt={`${label} ${index + 1}`}
                    fill
                    unoptimized
                    sizes="12rem"
                    className="object-cover"
                  />
                </div>
              </ImageFrame>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="label-caps text-[0.6rem] text-charcoal-muted hover:text-clay"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="label-caps text-[0.6rem] text-charcoal-muted hover:text-clay"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                >
                  →
                </button>
                <button
                  type="button"
                  className="label-caps text-[0.6rem] text-clay"
                  onClick={() => removeAt(index)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="block w-full hairline-border border-dashed bg-concrete-dark/30 p-6 text-left transition-colors duration-200 hover:bg-concrete-dark/50 disabled:opacity-50"
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
        disabled={isUploading || atLimit}
      >
        <div className="py-6 text-center">
          <p className="eyebrow text-clay">
            {atLimit ? "Gallery full" : "Add gallery image"}
          </p>
          <p className="type-infill mt-2">
            {atLimit
              ? `Maximum ${maxItems} images.`
              : "Drop or click to upload another plate."}
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={labelId}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {isUploading && (
        <ProcessProgressBar
          className="mt-3"
          compact
          stepLabel="Uploading image"
          progress={uploadProgress}
        />
      )}
      {error && (
        <p id={errorId} className="type-infill mt-3 text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { parseGallery, serializeGallery };

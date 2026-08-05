"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { uploadImage } from "@/lib/api/upload";

interface ReferenceImagesFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function ReferenceImagesField({
  value,
  onChange,
  error,
}: ReferenceImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const labelId = useId();
  const descId = useId();
  const errorId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepLabel, setUploadStepLabel] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    const fileList = Array.from(files);
    const uploaded: string[] = [];

    try {
      for (let index = 0; index < fileList.length; index += 1) {
        const file = fileList[index];
        setUploadStepLabel(
          fileList.length > 1
            ? `Uploading image ${index + 1} of ${fileList.length}`
            : "Uploading image"
        );

        const response = await uploadImage(file, {
          onProgress: (fileProgress) => {
            const overall =
              fileList.length === 1
                ? fileProgress
                : Math.round(
                    ((index + fileProgress / 100) / fileList.length) * 100
                  );
            setUploadProgress(overall);
          },
        });
        uploaded.push(response.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  const combinedError = uploadError || error;

  return (
    <div>
      <label id={labelId} htmlFor={inputId} className="label-caps mb-2 block">
        Reference images
      </label>
      <p id={descId} className="type-infill mb-4 text-charcoal-muted">
        Optional — site photos, sketches, or precedent images. Drop files or
        click to select. Image formats only.
      </p>

      <button
        type="button"
        className="block w-full hairline-border border-dashed bg-concrete-dark/30 p-6 text-left transition-colors duration-200 hover:bg-concrete-dark/50 disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFiles(event.dataTransfer.files);
        }}
        disabled={isUploading}
        aria-labelledby={labelId}
        aria-describedby={
          [descId, combinedError ? errorId : null].filter(Boolean).join(" ")
        }
        aria-invalid={Boolean(combinedError)}
      >
        <div className="py-6 text-center">
          <p className="eyebrow text-clay">
            {isUploading ? uploadStepLabel || "Uploading…" : "Drop images here"}
          </p>
          <p className="type-infill mt-3">Or click to select files</p>
        </div>
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={labelId}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {isUploading && (
        <ProcessProgressBar
          className="mt-3"
          compact
          stepLabel={uploadStepLabel || "Uploading images"}
          progress={uploadProgress}
        />
      )}

      {value.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <li key={url} className="relative">
              <ImageFrame>
                <div className="relative aspect-[4/3] bg-concrete-dark">
                  <Image
                    src={url}
                    alt={`Reference image ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 12rem, 33vw"
                    className="object-cover"
                  />
                </div>
              </ImageFrame>
              <button
                type="button"
                className="action-secondary mt-2"
                onClick={() => removeImage(url)}
                aria-label={`Remove reference image ${index + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {combinedError && (
        <p id={errorId} className="type-infill mt-3 text-clay" role="alert">
          {combinedError}
        </p>
      )}
    </div>
  );
}

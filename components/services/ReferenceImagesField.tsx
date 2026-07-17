"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setIsUploading(true);
    setUploadError("");

    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const response = await uploadImage(file);
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

  return (
    <div>
      <p className="label-caps mb-2">Reference images</p>
      <p className="type-infill mb-4 text-charcoal-muted">
        Optional — site photos, sketches, or precedent images.
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
      >
        <div className="py-6 text-center">
          <p className="eyebrow text-clay">
            {isUploading ? "Uploading…" : "Drop images here"}
          </p>
          <p className="type-infill mt-3">Or click to select files</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {value.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((url) => (
            <li key={url} className="relative">
              <ImageFrame>
                <div className="relative aspect-[4/3] bg-concrete-dark">
                  <Image
                    src={url}
                    alt=""
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
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {(uploadError || error) && (
        <p className="type-infill mt-3 text-clay" role="alert">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

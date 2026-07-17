"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { uploadImage } from "@/lib/api/upload";

interface PaymentScreenshotFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** InstaPay proof upload for checkout — keeps cart FE free of admin imports. */
export function PaymentScreenshotField({
  label,
  value,
  onChange,
}: PaymentScreenshotFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const response = await uploadImage(file);
      onChange(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <p className="label-caps mb-2">{label}</p>
      <button
        type="button"
        className="block w-full hairline-border border-dashed bg-concrete-dark/30 p-6 text-left transition-colors duration-200 hover:bg-concrete-dark/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <ImageFrame>
            <div className="relative aspect-[4/3] bg-concrete-dark">
              <Image
                src={value}
                alt=""
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
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {isUploading && (
        <p className="label-caps mt-3 text-charcoal-muted loader-pulse">
          Uploading
        </p>
      )}
      {error && <p className="type-infill mt-3 text-clay">{error}</p>}
    </div>
  );
}

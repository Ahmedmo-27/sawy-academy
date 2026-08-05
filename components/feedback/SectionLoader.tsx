"use client";

import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";

interface SectionLoaderProps {
  label?: string;
  stepLabel?: string;
  progress?: number;
  className?: string;
}

export function SectionLoader({
  label = "Loading…",
  stepLabel,
  progress,
  className = "",
}: SectionLoaderProps) {
  return (
    <div className={`py-16 ${className}`}>
      <ProcessProgressBar
        label={label}
        stepLabel={stepLabel ?? label}
        progress={progress}
      />
    </div>
  );
}

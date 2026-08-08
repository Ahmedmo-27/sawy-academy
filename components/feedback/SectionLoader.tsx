"use client";

import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

interface SectionLoaderProps {
  label?: string;
  stepLabel?: string;
  progress?: number;
  className?: string;
  fullScreen?: boolean;
}

export function SectionLoader({
  label = "Loading…",
  stepLabel,
  progress,
  className = "",
  fullScreen = false,
}: SectionLoaderProps) {
  if (fullScreen) return <LoadingScreen label={stepLabel ?? label} />;

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

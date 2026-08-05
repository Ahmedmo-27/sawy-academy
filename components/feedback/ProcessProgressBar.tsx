"use client";

interface ProcessProgressBarProps {
  progress?: number;
  label?: string;
  stepLabel?: string;
  compact?: boolean;
  className?: string;
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function ProcessProgressBar({
  progress,
  label,
  stepLabel,
  compact = false,
  className = "",
}: ProcessProgressBarProps) {
  const hasProgress = typeof progress === "number";
  const displayProgress = hasProgress ? clampProgress(progress) : null;

  return (
    <div
      className={`w-full ${compact ? "max-w-xs" : "max-w-sm"} ${className}`}
      role={hasProgress ? "progressbar" : "status"}
      aria-valuemin={hasProgress ? 0 : undefined}
      aria-valuemax={hasProgress ? 100 : undefined}
      aria-valuenow={displayProgress ?? undefined}
      aria-valuetext={
        hasProgress && stepLabel
          ? `${stepLabel} — ${displayProgress}%`
          : stepLabel || label
      }
      aria-live="polite"
    >
      {(label || stepLabel) && (
        <div
          className={`flex items-baseline justify-between gap-3 ${
            compact ? "mb-2" : "mb-3"
          }`}
        >
          <p
            className={`label-caps text-charcoal-muted ${
              !hasProgress ? "loader-pulse" : ""
            }`}
          >
            {stepLabel || label}
          </p>
          {hasProgress && (
            <span className="label-caps text-clay tabular-nums shrink-0">
              {displayProgress}%
            </span>
          )}
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden bg-hairline ${
          compact ? "h-px" : "h-0.5"
        }`}
      >
        {hasProgress ? (
          <div
            className="absolute inset-y-0 left-0 bg-clay/60 transition-[width] duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        ) : (
          <div className="process-progress-indeterminate absolute inset-y-0 w-1/3 bg-clay/50" />
        )}
      </div>
    </div>
  );
}

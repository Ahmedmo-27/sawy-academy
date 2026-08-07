import Link from "next/link";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

interface ProfileEmptyStateProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export function ProfileEmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: ProfileEmptyStateProps) {
  return (
    <ThresholdFrame label="Empty sheet">
      <div className="relative mt-4 overflow-hidden border border-hairline bg-concrete-dark/25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 8px, #1a1a1a 8px, #1a1a1a 9px)",
          }}
        />
        <div className="relative grid gap-8 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-10">
          <div>
            <p className="eyebrow text-clay">{title}</p>
            <p className="type-infill mt-3 max-w-md leading-relaxed">
              {message}
            </p>
          </div>
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="cta-entrance inline-flex shrink-0 self-start sm:self-end"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </ThresholdFrame>
  );
}

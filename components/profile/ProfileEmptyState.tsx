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
    <ThresholdFrame label="EMPTY SHEET">
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">{title}</p>
        <p className="type-infill mt-3 max-w-md">{message}</p>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="action-primary mt-6 inline-block">
            {actionLabel}
          </Link>
        )}
      </div>
    </ThresholdFrame>
  );
}

import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import Link from "next/link";

interface AdminErrorStateProps {
  title?: string;
  message: string;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
}

export function AdminErrorState({
  title = "Something went wrong",
  message,
  backHref,
  backLabel = "Back to list",
  onRetry,
}: AdminErrorStateProps) {
  return (
    <ThresholdFrame label="NEED HELP">
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">{title}</p>
        <p className="type-body mt-4 max-w-xl text-charcoal-muted">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {backHref && (
            <Link href={backHref} className="admin-btn admin-btn-primary">
              {backLabel}
            </Link>
          )}
          {onRetry && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onRetry}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </ThresholdFrame>
  );
}

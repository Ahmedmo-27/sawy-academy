import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

interface AdminEmptyStateProps {
  title?: string;
  message?: string;
}

export function AdminEmptyState({
  title = "Nothing here yet",
  message = "When you add the first item, it will show up in this list.",
}: AdminEmptyStateProps) {
  return (
    <ThresholdFrame label="EMPTY">
      <div className="hairline-border bg-concrete-dark/30 p-8">
        <p className="eyebrow text-clay">{title}</p>
        <p className="type-body mt-3 max-w-md text-charcoal-muted">{message}</p>
      </div>
    </ThresholdFrame>
  );
}

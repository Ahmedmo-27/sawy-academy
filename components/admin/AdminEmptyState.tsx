import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { AsyncState } from "@/components/feedback/AsyncState";

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
      <AsyncState title={title} message={message} />
    </ThresholdFrame>
  );
}

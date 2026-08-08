import { AsyncState } from "@/components/feedback/AsyncState";
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
      <AsyncState
        className="mt-4"
        title={title}
        message={message}
        actionHref={actionHref}
        actionLabel={actionLabel}
      />
    </ThresholdFrame>
  );
}

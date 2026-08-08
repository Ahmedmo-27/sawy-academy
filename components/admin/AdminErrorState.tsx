import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { AsyncState } from "@/components/feedback/AsyncState";

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
      <AsyncState
        kind="error"
        title={title}
        message={message}
        actionHref={backHref}
        actionLabel={backHref ? backLabel : undefined}
        onRetry={onRetry}
      />
    </ThresholdFrame>
  );
}

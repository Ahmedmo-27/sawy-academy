"use client";

import { AsyncState } from "@/components/feedback/AsyncState";
import { PageContainer } from "@/components/layout/PageContainer";

export default function ResearchDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="pt-32 pb-20">
      <AsyncState
        kind="error"
        title="The research sheet could not be loaded"
        message="Check your connection and try opening this publication again."
        onRetry={reset}
        actionHref="/researches"
        actionLabel="Research index"
      />
    </PageContainer>
  );
}

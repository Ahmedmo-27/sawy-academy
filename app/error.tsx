"use client";

import { useEffect } from "react";
import { AsyncState } from "@/components/feedback/AsyncState";
import { PageContainer } from "@/components/layout/PageContainer";
import { logger } from "@/lib/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Route rendering failed", { error, digest: error.digest });
  }, [error]);

  return (
    <PageContainer className="section-rhythm min-h-[55svh] pt-32">
      <AsyncState
        kind="error"
        eyebrow="Drawing interrupted"
        title="This page could not be completed"
        message="The rest of the academy is still available. Try rebuilding this view, or return to the entrance."
        onRetry={reset}
        actionHref="/"
        actionLabel="Return home"
      />
    </PageContainer>
  );
}

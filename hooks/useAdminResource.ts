"use client";

import { useCallback, useEffect, useState } from "react";
import { toFriendlyAdminError } from "@/lib/admin/friendly";

type ProgressReporter = (progress: number, stepLabel?: string) => void;

type AdminResourceLoader<T> =
  | (() => Promise<T>)
  | ((onProgress: ProgressReporter) => Promise<T>);

export function useAdminResource<T>(
  loader: AdminResourceLoader<T>,
  label = "Loading…"
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [stepLabel, setStepLabel] = useState(label);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setProgress(undefined);
    setStepLabel(label);

    const reportProgress: ProgressReporter = (value, nextLabel) => {
      setProgress(value);
      if (nextLabel) setStepLabel(nextLabel);
    };

    try {
      const result =
        loader.length >= 1
          ? await (loader as (onProgress: ProgressReporter) => Promise<T>)(
              reportProgress
            )
          : await (loader as () => Promise<T>)();
      setData(result);
      setProgress(100);
    } catch (err) {
      setError(toFriendlyAdminError(err, "load this page"));
    } finally {
      setIsLoading(false);
    }
  }, [label, loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, setData, isLoading, error, progress, stepLabel, refetch };
}

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
    // #region agent log
    fetch('http://127.0.0.1:7439/ingest/93dbd8bb-58d0-4883-a233-6effa3c7ca00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac457f'},body:JSON.stringify({sessionId:'ac457f',runId:'pre-fix',hypothesisId:'A',location:'useAdminResource.ts:refetch',message:'refetch started',data:{label,loaderLength:loader.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7439/ingest/93dbd8bb-58d0-4883-a233-6effa3c7ca00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac457f'},body:JSON.stringify({sessionId:'ac457f',runId:'pre-fix',hypothesisId:'D',location:'useAdminResource.ts:success',message:'refetch succeeded',data:{label,hasResult:result!=null,isArray:Array.isArray(result),arrayLen:Array.isArray(result)?result.length:undefined},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setData(result);
      setProgress(100);
    } catch (err) {
      const friendly = toFriendlyAdminError(err, "load this page");
      // #region agent log
      fetch('http://127.0.0.1:7439/ingest/93dbd8bb-58d0-4883-a233-6effa3c7ca00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac457f'},body:JSON.stringify({sessionId:'ac457f',runId:'pre-fix',hypothesisId:'E',location:'useAdminResource.ts:error',message:'refetch failed',data:{label,friendly,errName:err instanceof Error?err.name:typeof err,errStatus:err && typeof err==='object'&&'status' in err?(err as {status:unknown}).status:undefined},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  }, [label, loader]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7439/ingest/93dbd8bb-58d0-4883-a233-6effa3c7ca00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac457f'},body:JSON.stringify({sessionId:'ac457f',runId:'pre-fix',hypothesisId:'A',location:'useAdminResource.ts:effect',message:'refetch effect fired (loader/label identity changed)',data:{label},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    void refetch();
  }, [refetch]);

  return { data, setData, isLoading, error, progress, stepLabel, refetch };
}

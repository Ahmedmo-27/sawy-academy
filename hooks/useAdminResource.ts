"use client";

import { useCallback, useEffect, useState } from "react";
import { toFriendlyAdminError } from "@/lib/admin/friendly";

export function useAdminResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setData(await loader());
    } catch (err) {
      setError(toFriendlyAdminError(err, "load this page"));
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, setData, isLoading, error, refetch };
}

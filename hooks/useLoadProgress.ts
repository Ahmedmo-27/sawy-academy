"use client";

import { useCallback, useState } from "react";

export interface LoadProgressState {
  progress: number;
  stepLabel: string;
  isLoading: boolean;
}

const initialState: LoadProgressState = {
  progress: 0,
  stepLabel: "",
  isLoading: false,
};

export function useLoadProgress(defaultLabel = "Loading…") {
  const [state, setState] = useState<LoadProgressState>({
    ...initialState,
    stepLabel: defaultLabel,
  });

  const start = useCallback((stepLabel = defaultLabel) => {
    setState({
      progress: 0,
      stepLabel,
      isLoading: true,
    });
  }, [defaultLabel]);

  const update = useCallback((progress: number, stepLabel?: string) => {
    setState((current) => ({
      ...current,
      progress,
      stepLabel: stepLabel ?? current.stepLabel,
      isLoading: true,
    }));
  }, []);

  const finish = useCallback(() => {
    setState((current) => ({
      ...current,
      progress: 100,
      isLoading: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      ...initialState,
      stepLabel: defaultLabel,
    });
  }, [defaultLabel]);

  return {
    ...state,
    start,
    update,
    finish,
    reset,
  };
}

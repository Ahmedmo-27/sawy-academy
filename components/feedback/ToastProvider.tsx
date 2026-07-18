"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast } from "@/components/feedback/Toast";

export type ToastType = "success" | "error" | "neutral";

export interface ToastInput {
  type?: ToastType;
  message: string;
  /** Auto-dismiss ms. Default 4000. Pass 0 to keep until closed. */
  duration?: number;
}

export interface ToastRecord extends Required<Pick<ToastInput, "message">> {
  id: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toast: (input: ToastInput | string) => string;
  success: (message: string) => string;
  error: (message: string) => string;
  neutral: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

function normalizeInput(input: ToastInput | string): Omit<ToastRecord, "id"> {
  if (typeof input === "string") {
    return { type: "neutral", message: input, duration: DEFAULT_DURATION };
  }
  return {
    type: input.type ?? "neutral",
    message: input.message,
    duration: input.duration ?? DEFAULT_DURATION,
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput | string) => {
    idRef.current += 1;
    const id = `toast-${idRef.current}`;
    setToasts((current) => [...current, { id, ...normalizeInput(input) }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast({ type: "success", message }),
      error: (message) => toast({ type: "error", message }),
      neutral: (message) => toast({ type: "neutral", message }),
      dismiss,
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((entry) => (
          <Toast key={entry.id} toast={entry} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

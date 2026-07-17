"use client";

import { useEffect, useRef, useState } from "react";
import type { ToastRecord } from "@/components/feedback/ToastProvider";

interface ToastProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}

/**
 * Single toast panel — sharp corners, hairline border, type-colored accent.
 * Close control is a text "×", matching sitewide type (no icon library).
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion.current) {
      setVisible(true);
      return;
    }

    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, toast.id, onDismiss]);

  return (
    <div
      className="toast-item"
      data-type={toast.type}
      data-visible={visible ? "true" : "false"}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      <p className="toast-message type-infill flex-1 min-w-0">{toast.message}</p>
      <button
        type="button"
        className="toast-dismiss"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

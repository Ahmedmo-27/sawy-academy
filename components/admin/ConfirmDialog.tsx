"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useFocusTrap } from "@/lib/a11y/focusTrap";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onCancel: () => void;
  /** Called on confirm. When reasonRequired, receives the trimmed reason. */
  onConfirm: (reason?: string) => void;
  /** Show a required reason textarea; confirm stays disabled until filled. */
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Pre-fill the reason field when the dialog opens. */
  reasonDefault?: string;
  /** admin = admin-btn classes; public = action-* underlines */
  variant?: "admin" | "public";
  /** danger uses the error token (destructive). primary = charcoal CTA. */
  confirmTone?: "danger" | "primary";
  children?: React.ReactNode;
}

/**
 * Shared confirmation modal (admin deletes, reject-with-reason, logout).
 * Extended in place — do not add a parallel ConfirmModal.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isBusy = false,
  onCancel,
  onConfirm,
  reasonRequired = false,
  reasonLabel = "Reason",
  reasonPlaceholder,
  reasonDefault = "",
  variant = "admin",
  confirmTone = "danger",
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const reasonId = useId();
  const reasonErrorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState(reasonDefault);
  const [reasonError, setReasonError] = useState("");

  useFocusTrap(open, dialogRef, { initialFocusRef: cancelRef });

  useEffect(() => {
    if (!open) return;
    setReason(reasonDefault);
    setReasonError("");
  }, [open, reasonDefault]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        event.stopPropagation();
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isBusy, onCancel]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function handleConfirm() {
    if (reasonRequired && !reason.trim()) {
      setReasonError("A reason is required.");
      return;
    }
    onConfirm(reasonRequired ? reason.trim() : undefined);
  }

  const cancelClass =
    variant === "public" ? "action-secondary" : "admin-btn admin-btn-secondary";
  const confirmClass =
    variant === "public"
      ? confirmTone === "danger"
        ? "action-danger"
        : "action-primary"
      : confirmTone === "danger"
        ? "admin-btn admin-btn-danger"
        : "admin-btn admin-btn-primary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-6"
      role="presentation"
      onClick={() => {
        if (!isBusy) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className="w-full max-w-lg outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <ThresholdFrame label="ARE YOU SURE?">
          <div className="hairline-border bg-concrete p-6 lg:p-8">
            <p id={titleId} className="eyebrow text-clay">
              {title}
            </p>
            <p id={messageId} className="type-body mt-4">
              {message}
            </p>

            {children}

            {reasonRequired && (
              <div className="mt-6">
                <label htmlFor={reasonId} className="label-caps block mb-2">
                  {reasonLabel}
                  <span className="text-clay"> *</span>
                </label>
                <textarea
                  id={reasonId}
                  name="confirm-reason"
                  rows={3}
                  value={reason}
                  placeholder={reasonPlaceholder}
                  disabled={isBusy}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(reasonError)}
                  aria-describedby={
                    reasonError ? reasonErrorId : undefined
                  }
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (reasonError) setReasonError("");
                  }}
                  className="w-full bg-transparent border border-hairline px-3 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200 resize-y min-h-[5rem]"
                />
                {reasonError && (
                  <p
                    id={reasonErrorId}
                    className="type-infill mt-2 text-error"
                    role="alert"
                  >
                    {reasonError}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-end gap-6">
              <button
                ref={cancelRef}
                type="button"
                className={cancelClass}
                onClick={onCancel}
                disabled={isBusy}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={confirmClass}
                onClick={handleConfirm}
                disabled={isBusy}
              >
                {isBusy ? "Please wait…" : confirmLabel}
              </button>
            </div>
          </div>
        </ThresholdFrame>
      </div>
    </div>
  );
}

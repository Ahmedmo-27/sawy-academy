"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/lib/a11y/focusTrap";

interface AdminEditModalProps {
  open: boolean;
  title: string;
  description?: string;
  context?: string;
  saveLabel?: string;
  isSaving?: boolean;
  isDirty?: boolean;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
}

export function AdminEditModal({
  open,
  title,
  description,
  context,
  saveLabel = "Save changes",
  isSaving = false,
  isDirty = true,
  size = "lg",
  children,
  onCancel,
  onSave,
}: AdminEditModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(open, dialogRef, { initialFocusRef: cancelRef });

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        event.stopPropagation();
        onCancel();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isSaving, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const width = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-charcoal/65 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full ${width} flex-col overflow-hidden border border-hairline bg-concrete shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)]`}
      >
        <header className="shrink-0 border-b border-hairline bg-concrete-dark/70 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {context && <p className="eyebrow mb-2 text-clay">{context}</p>}
              <h2 id={titleId} className="font-serif text-2xl font-light text-charcoal">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="type-infill mt-2 max-w-3xl text-charcoal-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-compact shrink-0"
              onClick={onCancel}
              disabled={isSaving}
              aria-label={`Close ${title}`}
            >
              Close
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>

        <footer className="shrink-0 border-t border-hairline bg-concrete/95 px-5 py-4 nav-blur sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <button
              ref={cancelRef}
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={onSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "Saving…" : saveLabel}
            </button>
            <span className="dim-label ml-auto" role="status">
              {isDirty ? "Changes not saved" : "No changes"}
            </span>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useRef } from "react";

interface FormErrorSummaryProps {
  errors: string[];
  title?: string;
}

export function FormErrorSummary({
  errors,
  title = "Please check the highlighted fields",
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors]);

  if (!errors.length) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="hairline-border border-error/40 bg-error/5 p-4 outline-none"
    >
      <p className="label-caps text-error">{title}</p>
      <ul className="type-infill mt-2 list-disc space-y-1 pl-5 text-charcoal-muted">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

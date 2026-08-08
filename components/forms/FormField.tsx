import { forwardRef, useId } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, id, className = "", required, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div>
        <label htmlFor={fieldId} className="label-caps mb-2 block">
          {label}
          {required && <span className="text-clay" aria-hidden="true"> *</span>}
        </label>
        <input
          {...props}
          ref={ref}
          id={fieldId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`form-control ${className}`}
        />
        {hint && (
          <p id={hintId} className="type-infill mt-2 text-charcoal-infill">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="type-infill mt-2 text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

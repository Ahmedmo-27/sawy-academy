"use client";

type FieldType =
  | "text"
  | "email"
  | "number"
  | "url"
  | "date"
  | "select"
  | "textarea";

interface Option {
  label: string;
  value: string;
}

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: FieldType;
  value: string;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  emptyLabel?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}

const inputClass =
  "w-full bg-concrete border border-hairline px-3 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function FormField({
  id,
  name,
  label,
  type = "text",
  value,
  placeholder,
  required = false,
  options = [],
  emptyLabel,
  error,
  hint,
  maxLength,
  showCharacterCount = false,
  rows = 5,
  onChange,
}: FormFieldProps) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
    showCharacterCount ? `${id}-count` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="label-caps block mb-2">
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          required={required}
          aria-required={required || undefined}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-hairline bg-concrete p-4 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
        />
      ) : type === "select" ? (
        <select
          id={id}
          name={name}
          required={required}
          aria-required={required || undefined}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          <option value="">
            {emptyLabel ?? (required ? "Select a page" : "None")}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          aria-required={required || undefined}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}

      <div className="mt-2 flex items-start justify-between gap-3">
        {hint && !error ? (
          <p id={`${id}-hint`} className="type-infill text-charcoal-muted">
            {hint}
          </p>
        ) : <span />}
        {showCharacterCount && (
          <p id={`${id}-count`} className="dim-label shrink-0" aria-live="polite">
            {value.length}{maxLength ? ` / ${maxLength}` : ""} characters
          </p>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="type-infill mt-2 text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

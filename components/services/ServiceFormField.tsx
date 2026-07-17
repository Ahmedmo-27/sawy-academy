"use client";

interface Option {
  label: string;
  value: string;
}

interface ServiceFormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "url" | "select" | "textarea";
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  options?: Option[];
  error?: string;
  onChange: (value: string) => void;
}

const inputClass =
  "w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function ServiceFormField({
  id,
  label,
  type = "text",
  value,
  placeholder,
  required = false,
  disabled = false,
  rows = 5,
  options = [],
  error,
  onChange,
}: ServiceFormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label-caps block mb-2">
        {label}
        {required && <span className="text-clay-muted"> *</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          required={required}
          disabled={disabled}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent hairline-border px-4 py-3 type-body text-charcoal resize-none focus-visible:border-clay transition-colors duration-200 disabled:opacity-60"
        />
      ) : type === "select" ? (
        <select
          id={id}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <option value="" disabled>
            Select
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
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} disabled:opacity-60`}
        />
      )}

      {error && (
        <p className="type-infill mt-2 text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

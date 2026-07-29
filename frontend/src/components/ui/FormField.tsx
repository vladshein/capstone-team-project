import { InputHTMLAttributes, forwardRef } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, ...inputProps }, ref) => {
    const fieldId = id ?? inputProps.name;

    return (
      <label htmlFor={fieldId} className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </span>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-[var(--radius-card)] border bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-text-subtle focus:border-accent ${
            error ? "border-danger" : "border-border"
          }`}
          {...inputProps}
        />
        {error && (
          <span className="mt-1 block text-xs text-danger">{error}</span>
        )}
      </label>
    );
  },
);
FormField.displayName = "FormField";
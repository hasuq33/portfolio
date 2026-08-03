'use client';

import { WidgetProps } from "./types";

export const TextWidget = ({
  field,
  value,
  onChange,
  readonly = false,
}: WidgetProps) => {
  return (
    <div className="space-y-2">

      <label
        htmlFor={field.name}
        className="text-sm font-medium"
      >
        {field.label}
      </label>

      <input
        id={field.name}
        type={field.widget === "password" ? "password" : field.widget === "email" ? "email" : field.widget === "url" ? "url" : "text"}
        value={value ?? ""}
        placeholder={field.placeholder}
        required={field.required}
        aria-required={field.required}
        readOnly={readonly}
        onChange={(e) =>
          onChange?.(e.target.value)
        }
        className="
          w-full
          h-11
          rounded-lg
          border
          border-border
          bg-background
          px-3
          text-sm
          transition-all

          focus:outline-none
          focus:ring-2
          focus:ring-primary/20
          focus:border-primary

          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      />

    </div>
  );
};

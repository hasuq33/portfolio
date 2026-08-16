"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export const TextAreaWidget = ({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) => (
  <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
    <Textarea
      id={field.name}
      value={value ?? ""}
      placeholder={field.placeholder}
      required={field.required}
      aria-required={field.required}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
      readOnly={readonly}
      disabled={disabled}
      autoFocus={field.autoFocus}
      onChange={(event) => onChange?.(event.target.value)}
      className={cn(
        fieldControlClassName,
        appearance === "form" && density === "compact" ? "min-h-20 py-2" : "min-h-24 py-2.5",
        "resize-y",
      )}
    />
  </FieldShell>
);

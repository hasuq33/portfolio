"use client";

import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export const TagsWidget = ({ field, value, onChange, readonly = false, disabled, error, density = "comfortable", appearance }: WidgetProps) => {
  const tags = Array.isArray(value) ? value : [];

  return (
    <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
      <input
        id={field.name}
        type="text"
        value={tags.join(", ")}
        placeholder={field.placeholder ?? "Add comma-separated tags"}
        readOnly={readonly}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        onChange={(event) => onChange?.(
          event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
        )}
        className={cn(
          fieldControlClassName,
          appearance === "form" ? density === "compact" ? "min-h-9" : "min-h-11" : "min-h-10",
        )}
      />
      {tags.length > 0 && !readonly && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{tag}</span>)}
        </div>
      )}
    </FieldShell>
  );
};

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export const TagsWidget = ({ field, value, onChange, readonly = false, disabled, error, density = "comfortable", appearance }: WidgetProps) => {
  const tags = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState(() => ({ value, text: tags.join(", ") }));
  // Keep the typed separators for our own updates. A new value from Save,
  // Discard, or another record resets the text to that record's tags.
  const inputText = draft.value === value ? draft.text : tags.join(", ");

  return (
    <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
      <input
        id={field.name}
        type="text"
        value={inputText}
        placeholder={field.placeholder ?? "Add comma-separated tags"}
        readOnly={readonly}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        onChange={(event) => {
          const text = event.target.value;
          const nextTags = text.split(",").map((tag) => tag.trim()).filter(Boolean);
          setDraft({ value: nextTags, text });
          onChange?.(nextTags);
        }}
        onBlur={() => setDraft({ value, text: tags.join(", ") })}
        className={cn(
          fieldControlClassName,
          appearance === "form" ? density === "compact" ? "min-h-9" : "min-h-11" : "min-h-10",
        )}
      />
      {tags.length > 0 && !readonly && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, index) => <span key={`${index}-${tag}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{tag}</span>)}
        </div>
      )}
    </FieldShell>
  );
};

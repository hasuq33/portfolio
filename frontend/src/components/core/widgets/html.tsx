"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import type { WidgetProps } from "./types";

export function HtmlWidget({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) {
  return (
    <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
      <Textarea id={field.name} value={value ?? ""} readOnly={readonly} disabled={disabled}
        required={field.required} aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        placeholder={field.placeholder ?? "<h2>Introduction</h2>\n<p>Write your article here.</p>"}
        spellCheck={false} onChange={(event) => onChange?.(event.target.value)}
        className={cn(fieldControlClassName, "min-h-[360px] resize-y py-3 font-mono text-sm leading-relaxed")} />
    </FieldShell>
  );
}

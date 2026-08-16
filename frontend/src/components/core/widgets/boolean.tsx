"use client";

import { Switch } from "@/components/ui/switch";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export const BooleanWidget = ({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) => (
  <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
    <div className={`flex items-center gap-3 ${appearance === "form" ? density === "compact" ? "min-h-9" : "min-h-11" : "min-h-10"}`}>
      <Switch
        id={field.name}
        checked={Boolean(value)}
        disabled={readonly || disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        onCheckedChange={(checked) => onChange?.(checked)}
        className="disabled:opacity-80"
      />
      <span className="text-sm text-muted-foreground">{value ? "Enabled" : "Disabled"}</span>
    </div>
  </FieldShell>
);

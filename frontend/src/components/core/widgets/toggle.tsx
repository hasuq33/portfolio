"use client";

import { Switch } from "@/components/ui/switch";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export function ToggleWidget({ field, value, onChange, readonly, disabled, error, density, appearance }: WidgetProps) {
  const checked = value === true;
  return <FieldShell field={field} error={error} disabled={disabled} density={density} appearance={appearance}>
    <div className="flex min-h-11 items-center gap-3">
      <Switch id={field.name} checked={checked} disabled={readonly || disabled}
        onCheckedChange={onChange} aria-required={field.required} aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        className="cursor-pointer data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-400 dark:data-[state=unchecked]:bg-slate-600 disabled:opacity-80" />
      <span aria-live="polite" className="text-sm font-medium">{checked ? field.trueLabel ?? "On" : field.falseLabel ?? "Off"}</span>
    </div>
  </FieldShell>;
}

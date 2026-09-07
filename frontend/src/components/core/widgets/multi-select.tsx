"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import type { WidgetProps } from "./types";

export function MultiSelectWidget({
  field,
  value,
  onChange,
  readonly = false,
  disabled = false,
  error,
  density = "comfortable",
  appearance,
}: WidgetProps) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  const editable = !readonly && !disabled;

  const toggle = (optionValue: string) => {
    if (!editable) return;
    onChange?.(
      selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue],
    );
  };

  return (
    <FieldShell
      field={field}
      appearance={appearance}
      density={density}
      error={error}
      disabled={disabled}
    >
      <div
        id={field.name}
        role="group"
        aria-label={field.label}
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {(field.options ?? []).map((option) => {
          const checked = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={!editable}
              aria-pressed={checked}
              onClick={() => toggle(option.value)}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                editable && "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/70 bg-background/50 text-muted-foreground",
                !editable && "opacity-80",
              )}
            >
              <span className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded border",
                checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}>
                {checked && <Check className="size-3" />}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

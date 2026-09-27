"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isHexColor, relationColorStyle } from "@/lib/color";
import { FieldShell, getFieldErrorId } from "./FieldShell";
import type { WidgetProps } from "./types";

export const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
];

export function ColorWidget({
  field,
  value,
  onChange,
  readonly,
  disabled,
  error,
  density,
  appearance,
}: WidgetProps) {
  const color = typeof value === "string" ? value : "";
  const invalid = color !== "" && !isHexColor(color);
  const message =
    error ??
    (invalid ? "Enter a six-digit HEX color, such as #3b82f6." : undefined);
  return (
    <FieldShell
      field={field}
      error={message}
      density={density}
      appearance={appearance}
      disabled={disabled}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border bg-muted px-2 text-xs text-foreground"
          style={relationColorStyle(color)}
          aria-label="Color preview"
        >
          Aa
        </span>
        {readonly ? (
          <span id={field.name} className="text-sm">
            {color || "No color"}
          </span>
        ) : (
          <>
            <input
              type="color"
              value={isHexColor(color) ? color : "#3b82f6"}
              disabled={disabled}
              onChange={(event) => onChange?.(event.target.value)}
              aria-label={`Choose custom ${field.label.toLowerCase()}`}
              className="h-9 w-9 cursor-pointer rounded border bg-background p-1 disabled:cursor-not-allowed"
            />
            <Input
              id={field.name}
              value={color}
              placeholder="#3b82f6"
              maxLength={7}
              disabled={disabled}
              aria-invalid={Boolean(message)}
              aria-describedby={
                message ? getFieldErrorId(field.name) : undefined
              }
              onChange={(event) => onChange?.(event.target.value)}
              className="max-w-36 font-mono"
            />
            {!field.required && color && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange?.("")}
              >
                Clear color
              </Button>
            )}
          </>
        )}
      </div>
      {!readonly && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Preset colors">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              aria-label={`Use ${preset}`}
              aria-pressed={color.toLowerCase() === preset}
              onClick={() => onChange?.(preset)}
              style={{ backgroundColor: preset }}
              className="size-6 cursor-pointer rounded-full border border-border/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 disabled:cursor-not-allowed"
            />
          ))}
        </div>
      )}
    </FieldShell>
  );
}

"use client";

import { WidgetProps } from "./types";

export const ImageWidget = ({ field, value, onChange, readonly }: WidgetProps) => (
  <div className="space-y-2">
    <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
    {value ? <img src={String(value)} alt="" className="h-20 w-20 rounded-lg border object-cover" /> : null}
    <input
      id={field.name}
      type="url"
      value={value ?? ""}
      placeholder={field.placeholder ?? "https://example.com/image.png"}
      readOnly={readonly}
      onChange={(event) => onChange?.(event.target.value)}
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

"use client";

import { Textarea } from "@/components/ui/textarea";
import { WidgetProps } from "./types";

export const TextAreaWidget = ({ field, value, onChange, readonly }: WidgetProps) => (
  <div className="space-y-2">
    <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
    <Textarea id={field.name} value={value ?? ""} placeholder={field.placeholder} readOnly={readonly} onChange={(event) => onChange?.(event.target.value)} className="min-h-28" />
  </div>
);

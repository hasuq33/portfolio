"use client";

import { Switch } from "@/components/ui/switch";
import { WidgetProps } from "./types";

export const BooleanWidget = ({ field, value, onChange, readonly }: WidgetProps) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
    <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
    <Switch id={field.name} checked={Boolean(value)} disabled={readonly} onCheckedChange={(checked) => onChange?.(checked)} />
  </div>
);

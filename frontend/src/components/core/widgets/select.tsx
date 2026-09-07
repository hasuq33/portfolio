"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/orm_service";
import type { ConfigOption } from "@/components/types/config";

export const SelectWidget = ({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) => {
  const [relationOptions, setRelationOptions] = useState<ConfigOption[]>([]);
  const [relationError, setRelationError] = useState<string>();
  useEffect(() => {
    if (!field.relation) return;
    let cancelled = false;
    const relation = field.relation;
    void (async () => {
      const response = await apiFetch({ url: `/api/${relation.model}/search`, method: "POST", headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ domain: relation.domain ?? [], fields: ["_id", relation.labelField], order: relation.order ?? `${relation.labelField} asc`, limit: 200 }), suppressGlobalError: true });
      if (!response?.ok) { if (!cancelled) setRelationError("Choices could not be loaded."); return; }
      const records = await response.json() as Array<Record<string, unknown>>;
      const options = records.map(record => ({ value: String(record._id), label: String(record[relation.labelField]) }));
      if (value && !options.some(option => option.value === value)) {
        const existing = await apiFetch({ url: `/api/${relation.model}/read`, method: "POST", headers: { "Content-Type": "application/json" }, payload: JSON.stringify({ id: value }), suppressGlobalError: true });
        if (existing?.ok) { const record = await existing.json(); options.push({ value: String(value), label: `${record[relation.labelField]}${record.active === false ? " (inactive)" : ""}` }); }
        else options.push({ value: String(value), label: "Unavailable record" });
      }
      if (!cancelled) { setRelationOptions(options); setRelationError(undefined); }
    })();
    return () => { cancelled = true; };
  }, [field.relation, value]);
  const options = field.relation ? relationOptions : field.options;
  return (
  <FieldShell field={field} appearance={appearance} density={density} error={error || relationError} disabled={disabled}>
    <Select value={value || (field.emptyLabel ? "__empty__" : "")} disabled={readonly || disabled} onValueChange={(selectedValue) => onChange?.(selectedValue === "__empty__" ? null : selectedValue)}>
      <SelectTrigger
        id={field.name}
        aria-required={field.required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined}
        className={cn(
          fieldControlClassName,
          appearance === "form"
            ? density === "compact" ? "h-9 min-h-9" : "h-11 min-h-11"
            : "h-10 min-h-10",
          "cursor-pointer",
        )}
      >
        <SelectValue placeholder={`Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent className="border-border/70 bg-popover bg-white dark:bg-gray-900 shadow-xl">
        <SelectGroup>
          {field.emptyLabel && <SelectItem value="__empty__" className="cursor-pointer">{field.emptyLabel}</SelectItem>}
          {options?.map((item) => (
            <SelectItem key={item.value} value={item.value} className="cursor-pointer">{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </FieldShell>
  );
};

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

export const SelectWidget = ({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) => (
  <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
    <Select value={value ?? ""} disabled={readonly || disabled} onValueChange={(selectedValue) => onChange?.(selectedValue)}>
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
      <SelectContent className="border-border/70 bg-popover shadow-xl">
        <SelectGroup>
          {field.options?.map((item) => (
            <SelectItem key={item.value} value={item.value} className="cursor-pointer">{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </FieldShell>
);

"use client";

import { WidgetProps } from "./types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SelectWidget = ({
  field,
  value,
  onChange,
  readonly,
}: WidgetProps) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={field.name}
        className="text-sm font-medium"
      >
        {field.label}
      </label>

      <Select
        value={value ?? ""}
        disabled={readonly}
        onValueChange={(selectedValue) => {
          onChange?.(selectedValue);
        }}
      >
        <SelectTrigger
          id={field.name}
          className="bg-white dark:bg-gray-900 w-full"
        >
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>

        <SelectContent className="bg-white dark:bg-gray-900">
          <SelectGroup>
            <SelectLabel>Select {field.label}</SelectLabel>

            {field.options?.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
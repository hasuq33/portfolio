"use client";

import { ReactNode } from "react";
import { ConfigField } from "@/components/types/config";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  field: ConfigField;
  appearance?: "default" | "form" | "settings";
  children: ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
  error?: string;
  disabled?: boolean;
}

export const fieldControlClassName = cn(
  "w-full rounded-lg border border-transparent bg-muted/45 px-3 text-sm text-foreground shadow-none outline-none transition-[background-color,border-color,box-shadow] duration-200",
  "placeholder:text-muted-foreground/70 hover:border-border/70 hover:bg-muted/65",
  "focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
  "aria-invalid:border-destructive aria-invalid:bg-destructive/[0.025] aria-invalid:ring-4 aria-invalid:ring-destructive/10",
  "read-only:border-transparent read-only:bg-transparent read-only:px-0 read-only:font-medium read-only:focus:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-80 dark:bg-white/[0.055] dark:hover:bg-white/[0.08] dark:focus:bg-background",
);

export const getFieldHelpId = (fieldName: string) => `${fieldName}-help`;
export const getFieldErrorId = (fieldName: string) => `${fieldName}-error`;

export function FieldShell({
  field,
  appearance = "default",
  children,
  className,
  density = "comfortable",
  error,
  disabled = false,
}: FieldShellProps) {
  const settingsAligned = appearance === "settings";
  const isForm = appearance === "form";

  return (
    <div className={cn(
      "group/field min-w-0",
      settingsAligned
        ? "grid grid-cols-1 gap-1.5 py-1.5 sm:grid-cols-[minmax(7.5rem,0.42fr)_minmax(0,1fr)] sm:items-start sm:gap-4"
        : density === "compact" ? "space-y-1" : "space-y-1.5",
      disabled && "text-muted-foreground",
      className,
    )}>
      <label
        htmlFor={field.name}
        className={cn(
          "inline-flex text-sm font-medium text-foreground",
          settingsAligned && "pt-2.5 leading-5 text-muted-foreground transition-colors group-focus-within/field:text-foreground",
          isForm && "leading-5 text-foreground/90",
          disabled && "text-muted-foreground",
        )}
      >
        {field.label}
        {field.required && <span className="ml-1 text-destructive/85" aria-hidden="true">*</span>}
      </label>
      <div className="min-w-0">
        {children}
        {error ? (
          <p id={getFieldErrorId(field.name)} role="alert" className="mt-1.5 text-xs font-medium leading-relaxed text-destructive">
            {error}
          </p>
        ) : field.helpText ? (
          <p id={getFieldHelpId(field.name)} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {field.helpText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

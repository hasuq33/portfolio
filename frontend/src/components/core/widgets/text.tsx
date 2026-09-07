"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldShell, fieldControlClassName, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export const TextWidget = ({
  field,
  value,
  onChange,
  readonly = false,
  disabled = false,
  error,
  density = "comfortable",
  appearance,
}: WidgetProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = field.widget === "password";
  const describedBy = error
    ? getFieldErrorId(field.name)
    : field.helpText ? getFieldHelpId(field.name) : undefined;

  return (
    <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
      <div className={cn("relative", field.prefix && "flex items-center gap-0")}>
        {field.prefix && <span className="shrink-0 rounded-l-md border border-r-0 border-border/70 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">{field.prefix}</span>}
        <input
          id={field.name}
          type={
            isPassword ? (showPassword ? "text" : "password")
              : field.widget === "email" ? "email"
              : field.widget === "url" ? "url"
              : field.widget === "tel" ? "tel"
              : field.widget === "date" ? "date"
              : "text"
          }
          value={value ?? ""}
          placeholder={field.placeholder}
          required={field.required}
          aria-required={field.required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          readOnly={readonly}
          disabled={disabled}
          autoFocus={field.autoFocus}
          autoComplete={isPassword ? "new-password" : field.widget === "email" ? "email" : undefined}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            fieldControlClassName,
            appearance === "form" ? (density === "compact" ? "min-h-9" : "min-h-11") : "min-h-10",
            isPassword && !readonly && "pr-11",
            field.prefix && "min-w-0 rounded-l-none",
          )}
        />
        {isPassword && !readonly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
    </FieldShell>
  );
};

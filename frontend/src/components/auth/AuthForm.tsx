"use client";

import { ReactNode, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="form-format flex items-center justify-center bg-muted/30 px-4">
      <section className="w-full max-w-md space-y-6 rounded-3xl border bg-card p-6 shadow-lg dark:bg-gray-900" aria-labelledby="auth-title">
        <div className="space-y-1 text-center">
          <h1 id="auth-title" className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children}
        {footer}
      </section>
    </div>
  );
}

interface AuthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  error?: string;
  icon: ReactNode;
}

export function AuthTextField({ label, error, icon, id, name, ...props }: AuthFieldProps) {
  const inputId = id ?? name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
      <InputGroup className={cn(error && "border-destructive ring-2 ring-destructive/10")}>
        <InputGroupAddon>{icon}</InputGroupAddon>
        <InputGroupInput
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        />
      </InputGroup>
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function AuthPasswordField({ label, error, id, name, ...props }: Omit<AuthFieldProps, "icon" | "type">) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
      <InputGroup className={cn(error && "border-destructive ring-2 ring-destructive/10")}>
        <InputGroupAddon><LockKeyhole className="size-4 text-muted-foreground" /></InputGroupAddon>
        <InputGroupInput
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide password" : "Show password"}
            title={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function AuthMessage({ type, children }: { type: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
        type === "error"
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
      )}
    >
      {children}
    </div>
  );
}

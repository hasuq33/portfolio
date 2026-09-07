"use client";

import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import type { WidgetProps } from "./types";

type Permission = "read" | "create" | "write" | "delete";

interface AccessEntry {
  model: string;
  read: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
}

const permissions: Array<{ key: Permission; label: string }> = [
  { key: "read", label: "Read" },
  { key: "create", label: "Create" },
  { key: "write", label: "Write" },
  { key: "delete", label: "Delete" },
];

const emptyEntry = (model: string): AccessEntry => ({
  model,
  read: false,
  create: false,
  write: false,
  delete: false,
});

export function AccessRightsWidget({
  field,
  value,
  onChange,
  readonly = false,
  disabled = false,
  error,
  density = "comfortable",
  appearance,
}: WidgetProps) {
  const entries = Array.isArray(value) ? value as AccessEntry[] : [];
  const editable = !readonly && !disabled;
  const byModel = new Map(entries.map((entry) => [entry.model, entry]));

  const setPermission = (
    model: string,
    permission: Permission,
    checked: boolean,
  ) => {
    if (!editable) return;
    const nextByModel = new Map(byModel);
    nextByModel.set(model, {
      ...(nextByModel.get(model) ?? emptyEntry(model)),
      [permission]: checked,
    });
    onChange?.(Array.from(nextByModel.values()));
  };

  return (
    <FieldShell
      field={field}
      appearance={appearance}
      density={density}
      error={error}
      disabled={disabled}
    >
      <div id={field.name} className="overflow-x-auto rounded-lg border border-border/70">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead className="bg-muted/45 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Model</th>
              {permissions.map((permission) => (
                <th key={permission.key} scope="col" className="w-24 px-3 py-3 text-center">{permission.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(field.accessModels ?? []).map((model) => {
              const entry = byModel.get(model.value) ?? emptyEntry(model.value);
              return (
                <tr key={model.value} className="hover:bg-muted/25">
                  <th scope="row" className="px-4 py-3 text-left font-medium">{model.label}</th>
                  {permissions.map((permission) => {
                    const id = `${field.name}-${model.value}-${permission.key}`;
                    return (
                      <td key={permission.key} className="px-3 py-3 text-center">
                        <input
                          id={id}
                          type="checkbox"
                          checked={Boolean(entry[permission.key])}
                          disabled={!editable}
                          onChange={(event) => setPermission(model.value, permission.key, event.target.checked)}
                          aria-label={`${model.label}: ${permission.label}`}
                          className={cn(
                            "size-4 rounded border-border accent-primary",
                            editable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </FieldShell>
  );
}

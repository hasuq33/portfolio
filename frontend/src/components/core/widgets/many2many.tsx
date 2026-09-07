"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiFetch } from "@/lib/orm_service";
import { cn } from "@/lib/utils";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

type RelationRecord = Record<string, unknown>;

const relationRecordId = (record: RelationRecord, valueField: string) =>
  String(record[valueField] ?? "");

const relationValueId = (value: unknown, valueField: string) => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && valueField in value) {
    return String((value as RelationRecord)[valueField] ?? "");
  }
  return value === null || value === undefined ? "" : String(value);
};

export function ManyToManyWidget({
  field,
  value,
  onChange,
  readonly = false,
  disabled = false,
  error,
  density = "comfortable",
  appearance,
}: WidgetProps) {
  const relation = field.relation;
  const valueField = relation?.valueField ?? "_id";
  const selectedIds = useMemo(
    () => Array.from(new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => relationValueId(item, valueField))
        .filter(Boolean),
    )),
    [value, valueField],
  );
  const selectedKey = selectedIds.join(",");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<RelationRecord[]>([]);
  const [recordsById, setRecordsById] = useState<Record<string, RelationRecord>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();

  const model = relation?.model ?? "";
  const labelField = relation?.labelField ?? "name";
  const recordLabel = relation?.recordLabel ?? "record";
  const recordLabelPlural = relation?.recordLabelPlural ?? `${recordLabel}s`;
  const secondaryField = relation?.secondaryField;
  const searchFieldsKey = (relation?.searchFields ?? [labelField]).join(",");
  const domainKey = JSON.stringify(relation?.domain ?? []);
  const order = relation?.order ?? `${labelField} asc`;
  const limit = relation?.limit ?? 100;
  const responseFields = useMemo(
    () => Array.from(new Set([valueField, labelField, secondaryField].filter((item): item is string => Boolean(item)))),
    [labelField, secondaryField, valueField],
  );

  const mergeRecords = (records: RelationRecord[]) => {
    setRecordsById((current) => {
      const next = { ...current };
      for (const record of records) {
        const id = relationRecordId(record, valueField);
        if (id) next[id] = record;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!model || !selectedIds.length) return;
    let ignore = false;

    const loadSelectedRecords = async () => {
      const response = await apiFetch({
        url: `/api/${model}/search`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({
          fields: responseFields,
          domain: [[valueField, "in", selectedIds]],
          limit: Math.min(Math.max(selectedIds.length, 1), 200),
        }),
        suppressGlobalError: true,
      });
      if (!ignore && response?.ok) {
        mergeRecords(await response.json() as RelationRecord[]);
      }
    };

    void loadSelectedRecords();
    return () => { ignore = true; };
  }, [model, responseFields, selectedKey, valueField]);

  useEffect(() => {
    if (!open || !model) return;
    let ignore = false;

    const loadOptions = async () => {
      setLoading(true);
      setLoadError(undefined);
      const searchFields = searchFieldsKey.split(",").filter(Boolean);
      const response = await apiFetch({
        url: `/api/${model}/search`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({
          fields: responseFields,
          domain: JSON.parse(domainKey),
          order,
          limit,
          offset: 0,
          search: { query: debouncedQuery, fields: searchFields },
        }),
        suppressGlobalError: true,
      });

      if (!ignore && response?.ok) {
        const records = await response.json() as RelationRecord[];
        setOptions(records);
        mergeRecords(records);
      } else if (!ignore) {
        setOptions([]);
        setLoadError(`Could not load ${recordLabelPlural.toLowerCase()}.`);
      }
      if (!ignore) setLoading(false);
    };

    void loadOptions();
    return () => { ignore = true; };
  }, [debouncedQuery, domainKey, limit, model, open, order, recordLabelPlural, responseFields, searchFieldsKey]);

  if (!relation) {
    return (
      <FieldShell field={field} appearance={appearance} density={density} error="Relation configuration is missing.">
        <div />
      </FieldShell>
    );
  }

  const editable = !readonly && !disabled;
  const describedBy = error
    ? getFieldErrorId(field.name)
    : field.helpText
      ? getFieldHelpId(field.name)
      : undefined;
  const toggle = (id: string) => {
    onChange?.(selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]);
  };

  return (
    <FieldShell field={field} appearance={appearance} density={density} error={error} disabled={disabled}>
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-transparent bg-muted/45 px-2.5 py-2 transition-colors dark:bg-white/[0.055]",
          density === "compact" ? "min-h-9" : "min-h-11",
          error && "border-destructive bg-destructive/[0.025]",
          disabled && "opacity-80",
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        {selectedIds.map((id) => {
          const record = recordsById[id];
          const label = String(record?.[labelField] ?? id);
          return (
            <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <span className="truncate">{label}</span>
              {editable && (
                <button
                  type="button"
                  className="cursor-pointer rounded-full p-0.5 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggle(id)}
                  aria-label={`Remove ${label}`}
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          );
        })}

        {!selectedIds.length && (
          <span className="px-0.5 text-sm text-muted-foreground">No {recordLabelPlural.toLowerCase()} selected</span>
        )}

        {editable && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                id={field.name}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 cursor-pointer rounded-full px-2 text-xs"
                aria-describedby={describedBy}
              >
                <Plus className="size-3.5" /> Select {recordLabel.toLowerCase()}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>Select {recordLabelPlural.toLowerCase()}</DialogTitle>
                <DialogDescription>Choose one or more records for {field.label.toLowerCase()}.</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${recordLabelPlural.toLowerCase()}...`}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border" role="listbox" aria-multiselectable="true">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading {recordLabelPlural.toLowerCase()}...
                  </div>
                ) : loadError ? (
                  <p className="px-4 py-10 text-center text-sm text-destructive">{loadError}</p>
                ) : !options.length ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">No {recordLabelPlural.toLowerCase()} found.</p>
                ) : options.map((record) => {
                  const id = relationRecordId(record, valueField);
                  const selected = selectedIds.includes(id);
                  const label = String(record[labelField] ?? id);
                  const secondary = secondaryField ? record[secondaryField] : undefined;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => toggle(id)}
                      className="flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                      )}>
                        {selected && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{label}</span>
                        {secondary !== null && secondary !== undefined && secondary !== "" && (
                          <span className="block truncate text-xs text-muted-foreground">{String(secondary)}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </FieldShell>
  );
}

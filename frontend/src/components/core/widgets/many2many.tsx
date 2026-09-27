"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { cn } from "@/lib/utils";
import { relationColorStyle } from "@/lib/color";
import {
  canCreateRelation,
  loadSelectedRelations,
  quickCreateRelation,
  relationDraft,
  relationValueId,
  searchRelations,
  type RelationRecord,
} from "@/lib/relation-service";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import type { WidgetProps } from "./types";

const RelationForm = lazy(() =>
  import("../views/shared/ModelWorkspace").then((module) => ({
    default: module.ModelWorkspace,
  })),
);

export function ManyToManyWidget({
  field,
  value,
  onChange,
  readonly = false,
  disabled = false,
  error,
  density = "comfortable",
  appearance,
  resetKey,
}: WidgetProps) {
  const relation = field.relation;
  const valueField = relation?.valueField ?? "_id";
  const selectedIds = useMemo(
    () => [
      ...new Set(
        (Array.isArray(value) ? value : [])
          .map((item) => relationValueId(item, valueField))
          .filter(Boolean),
      ),
    ],
    [value, valueField],
  );
  const selectedKey = selectedIds.join(",");
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<RelationRecord[]>([]);
  const [recordsById, setRecordsById] = useState<
    Record<string, RelationRecord>
  >({});
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [selectedError, setSelectedError] = useState<string>();
  const [createAllowed, setCreateAllowed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<RelationRecord>();
  const [highlight, setHighlight] = useState(0);
  const pending = useRef(false);
  const generation = useRef(0);
  const listId = useId();
  const labelField = relation?.labelField ?? "name";
  const recordLabel = relation?.recordLabel ?? "record";
  const plural = relation?.recordLabelPlural ?? `${recordLabel}s`;
  const editable = !readonly && !disabled;
  // Form configs can reference other form configs; only serialize transport metadata.
  const { formConfig: _formConfig, ...relationTransport } = relation ?? {};
  const relationKey = JSON.stringify(relationTransport);
  const merge = (records: RelationRecord[]) =>
    setRecordsById((current) => ({
      ...current,
      ...Object.fromEntries(
        records.map((record) => [relationValueId(record, valueField), record]),
      ),
    }));

  useEffect(() => {
    generation.current++;
    pending.current = false;
    setCreating(false);
    setDraft(undefined);
    setOpen(false);
    setQuery("");
    setRecordsById({});
    setOptions([]);
    setCreateAllowed(false);
    return () => {
      generation.current++;
    };
  }, [relationKey, resetKey]);

  useEffect(() => {
    if (!relation || !selectedIds.length) return;
    let ignore = false;
    setResolving(true);
    setSelectedError(undefined);
    void loadSelectedRelations(relation, selectedIds)
      .then((records) => {
        if (!ignore) merge(records);
      })
      .catch(() => {
        if (!ignore)
          setSelectedError(
            "Selected records could not be loaded. Reopen the selector to retry.",
          );
      })
      .finally(() => {
        if (!ignore) setResolving(false);
      });
    return () => {
      ignore = true;
    };
  }, [relationKey, selectedKey, resetKey, open]);

  useEffect(() => {
    if (!relation || !open) return;
    let ignore = false;
    setLoading(true);
    setLoadError(undefined);
    void searchRelations(relation, debouncedQuery)
      .then((records) => {
        if (!ignore) {
          setOptions(records);
          merge(records);
          setHighlight(0);
        }
      })
      .catch((reason) => {
        if (!ignore) {
          setOptions([]);
          setLoadError(reason.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [relationKey, debouncedQuery, open]);

  useEffect(() => {
    setCreateAllowed(false);
    if (!relation || !field.create || !editable || !open) return;
    let ignore = false;
    void canCreateRelation(relation)
      .then((allowed) => {
        if (!ignore) setCreateAllowed(allowed);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [relationKey, field.create, editable, open]);

  useEffect(() => {
    document
      .getElementById(`${listId}-${highlight}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [highlight, listId]);

  if (!relation)
    return (
      <FieldShell
        field={field}
        appearance={appearance}
        density={density}
        error="Relation configuration is missing."
      >
        <div />
      </FieldShell>
    );
  const describedBy = error
    ? getFieldErrorId(field.name)
    : field.helpText
      ? getFieldHelpId(field.name)
      : undefined;
  const publish = (ids: string[]) => {
    selectedRef.current = ids;
    onChange?.(ids);
  };
  const toggle = (id: string) => {
    if (editable && !pending.current)
      publish(
        selectedRef.current.includes(id)
          ? selectedRef.current.filter((item) => item !== id)
          : [...selectedRef.current, id],
      );
  };
  const selectCreated = (record: RelationRecord) => {
    const id = relationValueId(record, valueField);
    if (!id) {
      setLoadError("The created record did not return an identifier.");
      return;
    }
    merge([record]);
    publish([...new Set([...selectedRef.current, id])]);
    setDraft(undefined);
    setOpen(false);
    setQuery("");
  };
  const fullForm = () => {
    if (relation.formConfig) setDraft(relationDraft(relation, query));
  };
  const quickCreate = async () => {
    if (!editable || !createAllowed || pending.current || !query.trim()) return;
    pending.current = true;
    setCreating(true);
    setLoadError(undefined);
    const version = generation.current;
    try {
      const result = await quickCreateRelation(relation, query.trim());
      if (version !== generation.current) return;
      if (result.record) selectCreated(result.record);
      else if (result.requiresForm) fullForm();
    } catch (reason) {
      if (version === generation.current)
        setLoadError(
          reason instanceof Error ? reason.message : "Creation failed.",
        );
    } finally {
      if (version === generation.current) {
        pending.current = false;
        setCreating(false);
      }
    }
  };
  const searching = loading || query !== debouncedQuery;
  const exact = options.some(
    (record) =>
      String(record[labelField]).trim().toLocaleLowerCase() ===
      query.trim().toLocaleLowerCase(),
  );
  const showCreate = Boolean(
    field.create &&
    createAllowed &&
    editable &&
    query.trim() &&
    !searching &&
    !exact &&
    !loadError,
  );
  const itemCount =
    options.length +
    (showCreate ? 1 + Number(Boolean(relation.formConfig)) : 0);
  const activate = (index: number) => {
    if (searching || creating) return;
    if (index < options.length)
      toggle(relationValueId(options[index], valueField));
    else if (showCreate && index === options.length) void quickCreate();
    else if (showCreate) fullForm();
  };
  const chip = (record?: RelationRecord) =>
    relationColorStyle(
      relation.colorField ? record?.[relation.colorField] : undefined,
    );

  return (
    <FieldShell
      field={field}
      appearance={appearance}
      density={density}
      error={error}
      disabled={disabled}
    >
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-transparent bg-muted/45 px-2.5 py-2 dark:bg-white/[0.055]",
          density === "compact" ? "min-h-9" : "min-h-11",
          error && "border-destructive",
          disabled && "opacity-80",
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        {selectedIds.map((id) => {
          const record = recordsById[id];
          const label = String(
            record?.[labelField] ??
              (resolving ? "Loading…" : "Unavailable record"),
          );
          return (
            <span
              key={id}
              style={chip(record)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/30 bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <span className="truncate">{label}</span>
              {editable && (
                <button
                  type="button"
                  disabled={creating}
                  aria-label={`Remove ${label}`}
                  onClick={() => toggle(id)}
                  className="cursor-pointer rounded-full p-0.5 hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          );
        })}
        {!selectedIds.length && (
          <span className="text-sm text-muted-foreground">
            No {plural.toLowerCase()} selected
          </span>
        )}
        {editable && (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              if (!creating) setOpen(next);
            }}
          >
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
            <DialogContent
              className="bg-background text-foreground sm:max-w-xl"
              onEscapeKeyDown={(event) => {
                event.stopPropagation();
                if (creating || draft) event.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle>Select {plural.toLowerCase()}</DialogTitle>
                <DialogDescription>
                  Choose one or more records for {field.label.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  disabled={creating}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlight(0);
                  }}
                  placeholder={`Search ${plural.toLowerCase()}...`}
                  aria-label={`Search ${plural.toLowerCase()}`}
                  className="pl-9"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-activedescendant={
                    !searching && itemCount
                      ? `${listId}-${highlight}`
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (
                      ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                    if (event.key === "Escape" && !creating) setOpen(false);
                    if (itemCount && event.key === "ArrowDown")
                      setHighlight((index) => (index + 1) % itemCount);
                    if (itemCount && event.key === "ArrowUp")
                      setHighlight(
                        (index) => (index - 1 + itemCount) % itemCount,
                      );
                    if (itemCount && event.key === "Enter" && !event.repeat)
                      activate(highlight);
                  }}
                  autoFocus
                />
              </div>
              {(searching || creating) && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="size-4 animate-spin" />
                  {creating ? "Creating…" : "Searching…"}
                </div>
              )}
              {loadError && (
                <p role="alert" className="text-sm text-destructive">
                  {loadError}
                </p>
              )}
              <div
                id={listId}
                className="max-h-80 overflow-y-auto rounded-lg border"
                role="listbox"
                aria-label={plural}
                aria-multiselectable="true"
                aria-busy={searching || creating}
              >
                {!searching && !options.length && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No {plural.toLowerCase()} found.
                  </p>
                )}
                {options.map((record, index) => {
                  const id = relationValueId(record, valueField);
                  const selected = selectedIds.includes(id);
                  return (
                    <button
                      key={id}
                      id={`${listId}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={creating || searching}
                      onClick={() => toggle(id)}
                      onFocus={() => setHighlight(index)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        highlight === index && "bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border",
                          selected &&
                            "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {selected && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          style={chip(record)}
                          className="inline-block max-w-full truncate rounded-full bg-muted px-2 py-1 text-sm text-foreground"
                        >
                          {String(record[labelField] ?? "Unnamed record")}
                        </span>
                        {relation.secondaryField && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {String(record[relation.secondaryField] ?? "")}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
                {showCreate && (
                  <>
                    <button
                      id={`${listId}-${options.length}`}
                      type="button"
                      role="option"
                      aria-selected={false}
                      disabled={creating}
                      onClick={() => void quickCreate()}
                      className={cn(
                        "w-full cursor-pointer px-4 py-3 text-left text-sm text-primary hover:bg-muted",
                        highlight === options.length && "bg-muted",
                      )}
                    >
                      Create “{query.trim()}”
                    </button>
                    {relation.formConfig && (
                      <button
                        id={`${listId}-${options.length + 1}`}
                        type="button"
                        role="option"
                        aria-selected={false}
                        disabled={creating}
                        onClick={fullForm}
                        className={cn(
                          "w-full cursor-pointer px-4 py-3 text-left text-sm text-primary hover:bg-muted",
                          highlight === options.length + 1 && "bg-muted",
                        )}
                      >
                        Create and Edit…
                      </button>
                    )}
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {selectedError && (
        <p role="status" className="mt-1 text-xs text-destructive">
          {selectedError}
        </p>
      )}
      {relation.manageHref && (
        <a
          href={relation.manageHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-muted-foreground underline"
        >
          Manage {field.label.toLowerCase()} (new tab)
        </a>
      )}
      {draft && relation.formConfig && (
        <Dialog
          open
          onOpenChange={() => {
            /* Close through FormView's dirty-state guard. */
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="max-h-[90dvh] overflow-y-auto bg-background text-foreground sm:max-w-5xl"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Create {recordLabel.toLowerCase()}</DialogTitle>
              <DialogDescription>
                Save to select this record. Your parent draft is preserved.
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<p role="status">Loading form…</p>}>
              <RelationForm
                embedded
                config={relation.formConfig}
                recordId="new"
                initialValues={draft}
                onCreated={selectCreated}
                onCancel={() => setDraft(undefined)}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </FieldShell>
  );
}

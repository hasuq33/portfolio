"use client";

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Rows3,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigField } from "@/components/types/config";
import WidgetRenderer from "@/components/core/widgets/WidgetRenderer";
import { cn } from "@/lib/utils";

export type FormDensity = "comfortable" | "compact";

export interface FormSectionConfig {
  id: string;
  title?: string;
  description?: string;
  fields: ConfigField[];
  columns?: 1 | 2;
}

export interface FormNotebookPage {
  id: string;
  label: string;
  description?: string;
  sections: FormSectionConfig[];
}

export interface FormBreadcrumb {
  label: string;
  href?: string;
}

export interface FormRecordNavigation {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

interface FormViewProps<TRecord extends Record<string, unknown>> {
  data: TRecord;
  title: string;
  description?: string;
  sections: FormSectionConfig[];
  notebooks?: FormNotebookPage[];
  readonly?: boolean;
  dirty?: boolean;
  saving?: boolean;
  errors?: Record<string, string | undefined>;
  formError?: string;
  density?: FormDensity;
  allowDensityToggle?: boolean;
  onChange?: (fieldName: string, value: unknown) => void;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void;
  onClose: () => void;
  actions?: ReactNode;
  breadcrumbs?: FormBreadcrumb[];
  recordNavigation?: FormRecordNavigation;
}

function FormSection<TRecord extends Record<string, unknown>>({
  section,
  data,
  readonly,
  disabled,
  density,
  errors,
  onChange,
}: {
  section: FormSectionConfig;
  data: TRecord;
  readonly: boolean;
  disabled: boolean;
  density: FormDensity;
  errors: Record<string, string | undefined>;
  onChange?: (fieldName: string, value: unknown) => void;
}) {
  const hasHeading = Boolean(section.title || section.description);
  const visibleFields = section.fields.filter((field) => !field.invisible);

  return (
    <section
      className={cn(
        density === "compact" ? "px-4 py-4 sm:px-5 sm:py-5" : "px-5 py-5 sm:px-7 sm:py-6",
        hasHeading && "lg:grid lg:grid-cols-[minmax(11rem,220px)_minmax(0,1fr)] lg:gap-8 xl:gap-10",
      )}
    >
      {hasHeading && (
        <div className={cn("lg:mb-0", density === "compact" ? "mb-4" : "mb-5")}>
          {section.title && <h2 className="font-semibold tracking-tight">{section.title}</h2>}
          {section.description && (
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{section.description}</p>
          )}
        </div>
      )}

      <div
        className={cn(
          "grid min-w-0 grid-cols-1",
          section.columns !== 1 && "xl:grid-cols-2",
          density === "compact" ? "gap-x-8 gap-y-3.5" : "gap-x-10 gap-y-5",
        )}
      >
        {visibleFields.map((field) => (
          <div key={field.name} className={cn("min-w-0", field.colSpan === 2 && section.columns !== 1 && "xl:col-span-2")}>
            <WidgetRenderer
              widget={field.widget}
              field={field}
              value={data[field.name] ?? (field.widget === "switch" ? false : "")}
              readonly={readonly || Boolean(field.readonly)}
              disabled={disabled || Boolean(field.disabled)}
              error={errors[field.name]}
              density={density}
              appearance="form"
              onChange={(value) => onChange?.(field.name, value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FormView<TRecord extends Record<string, unknown>>({
  data,
  title,
  description,
  sections,
  notebooks = [],
  readonly = false,
  dirty = false,
  saving = false,
  errors = {},
  formError,
  density = "comfortable",
  allowDensityToggle = false,
  onChange,
  onSave,
  onDiscard,
  onClose,
  actions,
  breadcrumbs = [],
  recordNavigation,
}: FormViewProps<TRecord>) {
  const tabIdPrefix = useId();
  const [activeNotebook, setActiveNotebook] = useState(notebooks[0]?.id ?? "");
  const [activeDensity, setActiveDensity] = useState<FormDensity>(density);
  const activePage = notebooks.find((page) => page.id === activeNotebook) ?? notebooks[0];

  useEffect(() => setActiveDensity(density), [density]);

  const confirmNavigation = useCallback((action?: () => void) => {
    if (!action || saving) return;
    if (dirty && !window.confirm("Discard your unsaved changes and continue?")) return;
    action();
  }, [dirty, saving]);

  useEffect(() => {
    const preventUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [dirty, saving]);

  useEffect(() => {
    const protectLinkNavigation = (event: MouseEvent) => {
      if (!dirty) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link || link.getAttribute("href")?.startsWith("#")) return;

      if (saving || !window.confirm("Discard your unsaved changes and continue?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", protectLinkNavigation, true);
    return () => document.removeEventListener("click", protectLinkNavigation, true);
  }, [dirty, saving]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!readonly && dirty && !saving && onSave) void onSave();
        return;
      }

      if (event.key !== "Escape" || !dirty || saving || !onDiscard) return;
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && Boolean(
        focused.closest("input, textarea, select, [role='combobox'], [role='dialog'], [role='menu']"),
      );
      if (editing) return;
      if (window.confirm("Discard your unsaved changes?")) onDiscard();
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [dirty, onDiscard, onSave, readonly, saving]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readonly && dirty && !saving && onSave) void onSave();
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % notebooks.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + notebooks.length) % notebooks.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = notebooks.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextPage = notebooks[nextIndex];
    setActiveNotebook(nextPage.id);
    document.getElementById(`${tabIdPrefix}-tab-${nextPage.id}`)?.focus();
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={saving}
      data-density={activeDensity}
      className="space-y-4 pb-3"
    >
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="px-1">
          <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((breadcrumb, index) => {
              const current = index === breadcrumbs.length - 1;
              return (
                <li key={`${breadcrumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                  {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
                  {breadcrumb.href && !current ? (
                    <Link
                      href={breadcrumb.href}
                      className="truncate rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span aria-current={current ? "page" : undefined} className={current ? "max-w-48 truncate px-1.5 py-1 font-medium text-foreground" : "px-1.5 py-1"}>
                      {breadcrumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2.5 rounded-2xl border border-border/70 bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={saving}
          onClick={() => confirmNavigation(onClose)}
          aria-label="Back to records"
          title="Back to records"
        >
          <ArrowLeft />
        </Button>

        <div className="min-w-32 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
            {readonly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <LockKeyhole className="size-3" /> Readonly
              </span>
            )}
          </div>
          {description && <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {dirty && !saving && (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 sm:inline-flex" aria-live="polite">
              <span className="size-1.5 rounded-full bg-current" /> Unsaved
            </span>
          )}

          {allowDensityToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveDensity((current) => current === "comfortable" ? "compact" : "comfortable")}
              aria-label={activeDensity === "comfortable" ? "Use compact form density" : "Use comfortable form density"}
              title={activeDensity === "comfortable" ? "Use compact density" : "Use comfortable density"}
            >
              <Rows3 className={activeDensity === "compact" ? "scale-y-75" : undefined} />
            </Button>
          )}

          {recordNavigation && (
            <div className="flex items-center overflow-hidden rounded-lg border border-border/70 bg-background" role="group" aria-label="Record navigation">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!recordNavigation.hasPrevious || saving}
                onClick={() => confirmNavigation(recordNavigation.onPrevious)}
                title="Previous record"
                aria-label="Previous record"
                className="rounded-none border-r border-border/70"
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!recordNavigation.hasNext || saving}
                onClick={() => confirmNavigation(recordNavigation.onNext)}
                title="Next record"
                aria-label="Next record"
                className="rounded-none"
              >
                <ChevronRight />
              </Button>
            </div>
          )}

          {actions}
          {!readonly && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || saving}
                onClick={onDiscard}
                title={dirty ? "Discard changes" : "No changes to discard"}
                aria-label="Discard changes"
              >
                <RotateCcw /> <span className="hidden sm:inline">Discard</span>
              </Button>
              <Button
                type="submit"
                variant={dirty ? "default" : "outline"}
                disabled={!dirty || saving}
                title={dirty ? "Save changes (Ctrl or Cmd + S)" : "No changes to save"}
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                <span>{saving ? "Saving..." : "Save"}</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-sm dark:bg-card/50">
        {sections.map((section) => (
          <FormSection
            key={section.id}
            section={section}
            data={data}
            readonly={readonly}
            disabled={saving}
            density={activeDensity}
            errors={errors}
            onChange={onChange}
          />
        ))}
      </div>

      {notebooks.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-sm dark:bg-card/50">
          <div className="overflow-x-auto whitespace-nowrap border-b border-border/60 bg-muted/20 px-3 pt-1.5">
            <div className="flex min-w-max gap-1" role="tablist" aria-label="Form notebook">
              {notebooks.map((page, index) => {
                const selected = activePage?.id === page.id;
                return (
                  <button
                    key={page.id}
                    id={`${tabIdPrefix}-tab-${page.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${tabIdPrefix}-panel-${page.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveNotebook(page.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={cn(
                      "cursor-pointer rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      selected
                        ? "border-primary bg-background/80 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {page.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activePage && (
            <div
              id={`${tabIdPrefix}-panel-${activePage.id}`}
              role="tabpanel"
              aria-labelledby={`${tabIdPrefix}-tab-${activePage.id}`}
              tabIndex={0}
              className="min-h-[17rem] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {activePage.description && (
                <p className={cn(
                  "border-b border-border/60 text-sm text-muted-foreground",
                  activeDensity === "compact" ? "px-5 py-3" : "px-5 py-3.5 sm:px-7",
                )}>
                  {activePage.description}
                </p>
              )}
              <div className="divide-y divide-border/60">
                {activePage.sections.map((section) => (
                  <FormSection
                    key={section.id}
                    section={section}
                    data={data}
                    readonly={readonly}
                    disabled={saving}
                    density={activeDensity}
                    errors={errors}
                    onChange={onChange}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </form>
  );
}

export function FormViewSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading form" aria-busy="true">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />
      <div className="flex h-16 items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4">
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="ml-auto h-9 w-40 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/70 px-5 py-6 sm:px-7">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="grid gap-x-10 gap-y-5 xl:grid-cols-2">
            <div className="h-20 animate-pulse rounded-lg bg-muted xl:col-span-2" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted/70" />
                <div className="h-11 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/70" />
    </div>
  );
}

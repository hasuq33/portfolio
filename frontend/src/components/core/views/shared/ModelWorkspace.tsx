"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useViewSearch } from "@/context/ViewSearchContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiFetch } from "@/lib/orm_service";
import { filtersToDomain } from "@/components/web/search-status-bar.types";
import { FormView, FormViewSkeleton } from "./FormView";
import { ListView } from "./ListView";
import { PaginationControls } from "./PaginationControls";
import type { ListColumn, ModelRecord } from "./types";
import type { ModelListField, ModelViewConfig } from "./model-view-config";
import { useUser } from "@/context/UserContext";
import { getCrudAccess } from "@/types/access";
import { slugify } from "@/lib/slug";

interface ModelWorkspaceProps {
  config: ModelViewConfig;
  recordId?: string;
  readonly?: boolean;
}

interface SearchResponse {
  records: ModelRecord[];
  total: number;
  limit: number;
  offset: number;
}

interface ApiErrorResponse {
  message?: string | string[];
  errors?: Array<{ field?: string; message?: string }>;
  fields?: string[];
}

const recordValue = (record: ModelRecord, fieldName: string) =>
  record[fieldName];

const imageEndpoint = (endpoint: string, id: string) => endpoint.replace("{id}", id);
const normalizeRecord = (config: ModelViewConfig, record: ModelRecord): ModelRecord => {
  const result = { ...config.form.defaults, ...record } as ModelRecord;
  for (const image of config.images ?? []) {
    result[image.field] = record[image.presentField]
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}${imageEndpoint(image.endpoint, record._id)}?v=${encodeURIComponent(String(record.updatedAt ?? ""))}` : null;
  }
  return result;
};

const renderListValue = (record: ModelRecord, field: ModelListField) => {
  const value = recordValue(record, field.name);
  if (field.kind === "image") return value && field.imageEndpoint
    ? <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}${imageEndpoint(field.imageEndpoint, record._id)}?v=${encodeURIComponent(String(record.updatedAt ?? ""))}`} alt="Cover" className="h-10 w-16 rounded-md object-cover" />
    : <span className="text-muted-foreground">—</span>;
  if (field.kind === "relation") return <span className="text-muted-foreground">{value && typeof value === "object" && "name" in value ? String(value.name) : "No Category"}</span>;
  if (field.kind === "date") return <span className="whitespace-nowrap text-muted-foreground">{value ? new Date(String(value)).toLocaleDateString() : "—"}</span>;
  if (field.kind === "status") {
    const active = Boolean(value);
    return (
      <span className={active
        ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
        : "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}
      >
        <span className={`mr-1.5 size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
        {active ? field.trueLabel ?? "Active" : field.falseLabel ?? "Archived"}
      </span>
    );
  }
  if (field.kind === "count") {
    const count = Array.isArray(value) ? value.length : 0;
    return <span className="text-muted-foreground">{count}</span>;
  }
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return <span className={field.primary ? "font-medium text-foreground" : "text-muted-foreground"}>{display}</span>;
};

const parseApiErrors = async (response: Response) => {
  let payload: ApiErrorResponse = {};
  try {
    payload = await response.json() as ApiErrorResponse;
  } catch {
    // The caller will use the generic fallback.
  }

  const fieldErrors = Object.fromEntries(
    (payload.errors ?? [])
      .filter((error): error is { field: string; message: string } => Boolean(error.field && error.message))
      .map((error) => [error.field, error.message]),
  );
  const responseMessage = Array.isArray(payload.message)
    ? payload.message.join("\n")
    : payload.message;
  for (const field of payload.fields ?? []) {
    fieldErrors[field] = responseMessage ?? "This value is already in use.";
  }

  return { fieldErrors, message: responseMessage };
};

export function ModelWorkspace({ config, recordId, readonly = false }: ModelWorkspaceProps) {
  const router = useRouter();
  const { user: currentUser, loading: accessLoading } = useUser();
  const permissions = getCrudAccess(currentUser?.access, config.accessKey);
  const canRead = permissions.read;
  const canCreate = permissions.create;
  const canWrite = permissions.write;
  const canDelete = permissions.delete;
  const formReadonly = readonly || (recordId === "new" ? !canCreate : !canWrite);
  const { state: searchState, configure, reset } = useViewSearch();
  const debouncedQuery = useDebouncedValue(searchState.query, 300);
  const [records, setRecords] = useState<ModelRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(config.list.pageSize ?? 24);
  const [loading, setLoading] = useState(!recordId);
  const [listError, setListError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [formLoading, setFormLoading] = useState(Boolean(recordId));
  const [formData, setFormData] = useState<ModelRecord | null>(null);
  const [originalFormData, setOriginalFormData] = useState<ModelRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [slugTouched, setSlugTouched] = useState(recordId !== "new");
  const [slugHint, setSlugHint] = useState<string>();
  const [categoryPathSegment, setCategoryPathSegment] = useState("");
  const slugValue = config.slug && formData ? String(formData[config.slug.field] ?? "") : "";
  const debouncedSlug = useDebouncedValue(slugValue, 450);
  const publicCategoryValue = config.publicPath?.categoryField && formData
    ? formData[config.publicPath.categoryField]
    : null;
  const publicCategoryId = publicCategoryValue && typeof publicCategoryValue === "object" && "_id" in publicCategoryValue
    ? String(publicCategoryValue._id)
    : publicCategoryValue ? String(publicCategoryValue) : "";

  useEffect(() => {
    const path = config.publicPath;
    if (!path?.categoryModel || !path.categorySlugField || !publicCategoryId) {
      setCategoryPathSegment("");
      return;
    }
    setCategoryPathSegment("");
    let ignore = false;
    void apiFetch({
      url: `/api/${path.categoryModel}/read`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({ id: publicCategoryId }),
      suppressGlobalError: true,
    }).then(async response => {
      if (!response?.ok || ignore) return;
      const category = await response.json() as ModelRecord;
      if (!ignore) setCategoryPathSegment(String(category[path.categorySlugField!] ?? ""));
    });
    return () => { ignore = true; };
  }, [config.publicPath, publicCategoryId]);

  useEffect(() => {
    const endpoint = config.slug?.availabilityEndpoint;
    if (!endpoint || !debouncedSlug || !canRead || accessLoading || !recordId) { setSlugHint(undefined); return; }
    let ignore = false;
    const params = new URLSearchParams({ slug: debouncedSlug });
    if (formData?._id && formData._id !== "new") params.set("excludeId", formData._id);
    void apiFetch({ url: `${endpoint}?${params}`, suppressGlobalError: true }).then(async response => {
      if (!response?.ok || ignore) return;
      const result = await response.json() as { available: boolean };
      if (!ignore) setSlugHint(result.available ? "URL available" : slugTouched ? "This URL is already in use." : "A numbered URL will be generated on save.");
    });
    return () => { ignore = true; };
  }, [accessLoading, canRead, config.slug, debouncedSlug, formData?._id, recordId, slugTouched]);

  const listColumns = useMemo<ListColumn<ModelRecord>[]>(
    () => config.list.fields.map((field) => ({
      id: field.name,
      label: field.label,
      className: field.className,
      render: (record) => renderListValue(record, field),
    })),
    [config.list.fields],
  );

  const apiFields = useMemo(
    () => ["_id", ...new Set(config.list.fields.map((field) => field.name)), "createdAt", "updatedAt"],
    [config.list.fields],
  );

  useEffect(() => {
    configure(config.search);
    return reset;
  }, [config.search, configure, reset]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedQuery, searchState.filters, searchState.searchField]);

  useEffect(() => {
    if (recordId || accessLoading || !canRead) {
      if (!accessLoading && !canRead) setLoading(false);
      return;
    }
    let ignore = false;

    const loadRecords = async () => {
      setLoading(true);
      setListError(undefined);
      const searchFields = searchState.searchField
        ? [searchState.searchField]
        : config.search.searchableFields?.map((field) => field.name) ?? [];
      const response = await apiFetch({
        url: `/api/${config.model}/search`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({
          fields: apiFields,
          order: config.list.order ?? `${config.labelField} asc`,
          limit,
          offset,
          domain: filtersToDomain(searchState.filters),
          search: { query: debouncedQuery, fields: searchFields },
          withCount: true,
        }),
      });

      if (!ignore && response?.ok) {
        const result = await response.json() as SearchResponse;
        setRecords(result.records);
        setTotal(result.total);
        if (result.total > 0 && offset >= result.total) {
          setOffset(Math.floor((result.total - 1) / limit) * limit);
        }
      }
      if (!ignore) {
        if (!response?.ok) setListError(`${config.title} could not be loaded. Please try again.`);
        setLoading(false);
      }
    };

    void loadRecords();
    return () => { ignore = true; };
  }, [accessLoading, apiFields, canRead, config.labelField, config.list.order, config.model, config.search.searchableFields, config.title, debouncedQuery, limit, offset, recordId, reloadKey, searchState.filters, searchState.searchField]);

  useEffect(() => {
    if (accessLoading) return;
    if (!recordId) {
      setFormData(null);
      setOriginalFormData(null);
      setFormLoading(false);
      return;
    }

    if (!canRead || (recordId === "new" && !canCreate)) {
      setFormData(null);
      setOriginalFormData(null);
      setFormLoading(false);
      return;
    }

    if (recordId === "new") {
      setSlugTouched(false);
      const draft = { _id: "new", ...config.form.defaults } as ModelRecord;
      setFormData(draft);
      setOriginalFormData(draft);
      setFieldErrors({});
      setFormError(undefined);
      setFormLoading(false);
      return;
    }

    let ignore = false;
    const loadRecord = async () => {
      setFormLoading(true);
      setFieldErrors({});
      setFormError(undefined);
      const response = await apiFetch({
        url: `/api/${config.model}/read`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ id: recordId }),
        suppressGlobalError: true,
      });
      if (!ignore && response?.ok) {
        const record = await response.json() as ModelRecord;
        const normalized = normalizeRecord(config, record);
        setSlugTouched(true);
        setFormData(normalized);
        setOriginalFormData(normalized);
      } else if (!ignore) {
        setFormData(null);
      }
      if (!ignore) setFormLoading(false);
    };

    void loadRecord();
    return () => { ignore = true; };
  }, [accessLoading, canCreate, canRead, config.form.defaults, config.model, recordId]);

  const dirty = useMemo(
    () => Boolean(formData && originalFormData && (
      JSON.stringify(formData) !== JSON.stringify(originalFormData) ||
      (config.images ?? []).some(image => formData[image.field] !== originalFormData[image.field])
    )),
    [config.images, formData, originalFormData],
  );

  const configuredFields = useMemo(
    () => [
      ...config.form.sections.flatMap((section) => section.fields),
      ...(config.form.notebooks ?? []).flatMap((page) => page.sections.flatMap((section) => section.fields)),
    ],
    [config.form.notebooks, config.form.sections],
  );

  const validate = () => {
    if (!formData) return {};
    const errors: Record<string, string> = {};
    for (const field of configuredFields) {
      if (field.invisible) continue;
      const value = formData[field.name];
      if (field.required && (
        value === null ||
        value === undefined ||
        (typeof value === "string" && !value.trim()) ||
        (Array.isArray(value) && value.length === 0)
      )) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
      if (field.widget === "email" && typeof value === "string" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = "Please enter a valid email address.";
      }
      if (field.widget === "url" && typeof value === "string" && value) {
        try {
          const parsed = new URL(value);
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch {
          errors[field.name] = "Please enter a valid HTTP or HTTPS URL.";
        }
      }
    }
    return errors;
  };

  const saveRecord = async () => {
    if (!formData || formReadonly || saving) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setFormError(undefined);
      requestAnimationFrame(() => document.getElementById(Object.keys(validationErrors)[0])?.focus());
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setFormError(undefined);
    try {
      const { _id, createdAt, updatedAt, __v, ...rawPayload } = formData;
      const payload: Record<string, unknown> = config.writableFields
        ? Object.fromEntries(config.writableFields.map(field => [field, rawPayload[field]])) : rawPayload;
      const isCreate = formData._id === "new";
      if (config.slug && isCreate) payload.autoSlug = !slugTouched;
      for (const image of config.images ?? []) { delete payload[image.field]; delete payload[image.presentField]; }
      const response = await apiFetch({
        url: isCreate ? `/api/${config.model}` : `/api/${config.model}/${formData._id}`,
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(payload),
        suppressGlobalError: true,
      });

      if (!response) {
        setFormError(`The ${config.singularTitle.toLowerCase()} could not be saved because the server is unavailable.`);
        return;
      }
      if (!response.ok) {
        const parsed = await parseApiErrors(response);
        setFieldErrors(parsed.fieldErrors);
        if (Object.keys(parsed.fieldErrors).length) {
          requestAnimationFrame(() => document.getElementById(Object.keys(parsed.fieldErrors)[0])?.focus());
        } else {
          setFormError(parsed.message ?? `The ${config.singularTitle.toLowerCase()} could not be saved.`);
        }
        return;
      }

      let saved = await response.json() as ModelRecord;
      const failedImages: Record<string, unknown> = {};
      for (const image of config.images ?? []) {
        const value = formData[image.field];
        const isFile = typeof File !== "undefined" && value instanceof File;
        if (!isFile && !(value === null && originalFormData?.[image.presentField])) continue;
        const upload = new FormData();
        if (isFile) upload.append("file", value);
        const imageResponse = await apiFetch({ url: imageEndpoint(image.endpoint, saved._id), method: isFile ? "PUT" : "DELETE", payload: isFile ? upload : undefined, suppressGlobalError: true });
        if (imageResponse?.ok) saved = await imageResponse.json() as ModelRecord;
        else failedImages[image.field] = value;
      }
      const normalized = normalizeRecord(config, saved);
      setFormData({ ...normalized, ...failedImages });
      setOriginalFormData(normalized);
      setSlugTouched(true);
      if (Object.keys(failedImages).length) {
        setFormError("The record was saved, but an image change failed. Your image selection is preserved; save again to retry.");
      } else if (recordId === "new") router.replace(`${config.route}/${saved._id}`);
    } finally {
      setSaving(false);
    }
  };

  const archiveReadonlyRecord = async (archiveField: string) => {
    if (!formData || recordId === "new" || !canDelete) return;
    setSaving(true);
    setFieldErrors({});
    setFormError(undefined);
    try {
      const response = await apiFetch({
        url: `/api/${config.model}/${recordId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ [archiveField]: false }),
        suppressGlobalError: true,
      });
      if (!response) {
        setFormError(`The ${config.singularTitle.toLowerCase()} could not be archived because the server is unavailable.`);
        return;
      }
      if (!response.ok) {
        const parsed = await parseApiErrors(response);
        setFormError(parsed.message ?? `The ${config.singularTitle.toLowerCase()} could not be archived.`);
        return;
      }
      const saved = await response.json() as ModelRecord;
      const normalized = { ...config.form.defaults, ...saved } as ModelRecord;
      setFormData(normalized);
      setOriginalFormData(normalized);
    } finally {
      setSaving(false);
    }
  };

  if (!accessLoading && (!canRead || (recordId === "new" && !canCreate))) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <p className="font-medium">Access denied</p>
          <p className="mt-1 text-sm text-muted-foreground">You do not have permission to open {config.title.toLowerCase()}.</p>
        </div>
      </main>
    );
  }

  if (recordId) {
    const label = String(formData?.[config.labelField] || config.singularTitle);
    const subtitle = config.subtitleField && formData?.[config.subtitleField]
      ? String(formData[config.subtitleField])
      : undefined;
    const archiveField = config.archiveField;
    const active = archiveField ? Boolean(formData?.[archiveField]) : true;

    return (
      <main className="mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-6">
        {formLoading ? <FormViewSkeleton /> : formData ? (
          <FormView
            data={formData}
            title={recordId === "new" ? `New ${config.singularTitle}` : label}
            description={recordId === "new" ? `Create a ${config.singularTitle.toLowerCase()}` : subtitle}
            sections={config.form.sections.map(section => ({ ...section, fields: section.fields.map(field => {
              if (field.name !== config.slug?.field) return field;
              const base = config.publicPath?.base.replace(/\/$/, "");
              return {
                ...field,
                ...(base ? { prefix: `${base}/${categoryPathSegment ? `${categoryPathSegment}/` : ""}` } : {}),
                ...(slugHint ? { helpText: slugHint } : {}),
              };
            }) }))}
            notebooks={config.form.notebooks}
            readonly={formReadonly}
            dirty={dirty}
            saving={saving}
            errors={fieldErrors}
            formError={formError}
            allowDensityToggle
            onChange={(fieldName, value) => {
              if (fieldName === config.slug?.field) setSlugTouched(true);
              setFormData((current) => {
                if (!current) return current;
                const next = { ...current, [fieldName]: value };
                if (current._id === "new" && config.slug && !slugTouched && fieldName === config.slug.source) next[config.slug.field] = slugify(String(value ?? ""));
                return next;
              });
              setFieldErrors((current) => {
                if (!current[fieldName]) return current;
                const next = { ...current };
                delete next[fieldName];
                return next;
              });
              setFormError(undefined);
            }}
            onSave={saveRecord}
            onDiscard={() => {
              if (originalFormData) setFormData(originalFormData);
              setSlugTouched(originalFormData?._id !== "new");
              setFieldErrors({});
              setFormError(undefined);
            }}
            onClose={() => router.push(config.route)}
            breadcrumbs={[
              ...(config.breadcrumbs ?? [{ label: "Settings", href: "/web/settings" }]),
              { label: config.title, href: config.route },
              { label: recordId === "new" ? `New ${config.singularTitle}` : label },
            ]}
            actions={archiveField && recordId !== "new" && ((active && canDelete) || (!active && canWrite)) ? (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                className="cursor-pointer"
                title={active && !canWrite
                  ? `Archive this ${config.singularTitle.toLowerCase()}`
                  : `${active ? "Archive" : "Restore"} this ${config.singularTitle.toLowerCase()}; save to apply`}
                onClick={() => {
                  if (active && !canWrite) {
                    void archiveReadonlyRecord(archiveField);
                    return;
                  }
                  setFormData((current) => current ? { ...current, [archiveField]: !active } : current);
                }}
              >
                {active ? <Archive /> : <ArchiveRestore />}
                <span className="hidden sm:inline">{active ? "Archive" : "Restore"}</span>
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <p className="font-medium">{config.singularTitle} could not be loaded</p>
            <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => router.push(config.route)}>Back to {config.title.toLowerCase()}</Button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 p-3 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
        </div>
        {canCreate && (
          <Button className="cursor-pointer" onClick={() => router.push(`${config.route}/new`)}>
            <Plus /> New {config.singularTitle}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 rounded-xl border p-4" aria-label={`Loading ${config.title.toLowerCase()}`} aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : listError ? (
        <div role="alert" className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{listError}</p>
          <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setReloadKey(key => key + 1)}>Try again</Button>
        </div>
      ) : (
        <ListView
          records={records}
          columns={listColumns}
          getRecordId={(record) => record._id}
          onOpenRecord={(record) => router.push(`${config.route}/${record._id}`)}
          emptyTitle={`No ${config.title.toLowerCase()} found`}
          emptyDescription={`Create your first ${config.singularTitle.toLowerCase()} or change the current search.`}
        />
      )}

      {!loading && !listError && (
        <PaginationControls
          offset={offset}
          limit={limit}
          total={total}
          onOffsetChange={setOffset}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setOffset(0);
          }}
        />
      )}
    </main>
  );
}

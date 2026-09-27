import type { ConfigRelation } from "@/components/types/config";
import { apiFetch } from "@/lib/orm_service";

export type RelationRecord = Record<string, unknown>;
export const relationValueId = (value: unknown, key = "_id"): string =>
  typeof value === "string"
    ? value
    : value && typeof value === "object"
      ? String((value as RelationRecord)[key] ?? "")
      : "";
const base = (relation: ConfigRelation) =>
  relation.apiBase ?? `/api/${relation.model}`;
const headers = (relation: ConfigRelation): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(relation.contextCompanyId
    ? { "X-Company-Id": relation.contextCompanyId }
    : {}),
});

export async function searchRelations(
  relation: ConfigRelation,
  query = "",
  ids?: string[],
): Promise<RelationRecord[]> {
  const valueField = relation.valueField ?? "_id";
  const response = await apiFetch({
    url: `${base(relation)}/search`,
    method: "POST",
    headers: headers(relation),
    suppressGlobalError: true,
    payload: JSON.stringify({
      fields: [
        ...new Set(
          [
            valueField,
            relation.labelField,
            relation.secondaryField,
            relation.colorField,
          ].filter(Boolean),
        ),
      ],
      domain: [
        ...(relation.domain ?? []),
        ...(ids ? [[valueField, "in", ids]] : []),
      ],
      order: relation.order ?? `${relation.labelField} asc`,
      limit: ids ? ids.length : (relation.limit ?? 100),
      offset: 0,
      search: { query, fields: relation.searchFields ?? [relation.labelField] },
    }),
  });
  if (!response?.ok)
    throw new Error("Could not load related records. Please try again.");
  const body = await response.json();
  const records = Array.isArray(body) ? body : body.records;
  if (!Array.isArray(records)) throw new Error("Unexpected relation response.");
  return records;
}

export async function loadSelectedRelations(
  relation: ConfigRelation,
  ids: string[],
) {
  const result: RelationRecord[] = [];
  for (let index = 0; index < ids.length; index += 200)
    result.push(
      ...(await searchRelations(relation, "", ids.slice(index, index + 200))),
    );
  return result;
}

export async function canCreateRelation(
  relation: ConfigRelation,
): Promise<boolean> {
  if (relation.companyField && !relation.contextCompanyId) return false;
  const response = await apiFetch({
    url: `/api/${relation.model}/access`,
    method: "POST",
    headers: headers(relation),
    suppressGlobalError: true,
  });
  return Boolean(response?.ok && (await response.json()).create);
}

export const relationDraft = (relation: ConfigRelation, name: string) => ({
  ...relation.formConfig?.form.defaults,
  ...relation.creationDefaults,
  [relation.labelField]: name.trim(),
});

export function requiresRelationForm(
  relation: ConfigRelation,
  draft: RelationRecord,
) {
  const form = relation.formConfig?.form;
  const fields = [
    ...(form?.sections ?? []).flatMap((section) => section.fields),
    ...(form?.notebooks ?? []).flatMap((page) =>
      page.sections.flatMap((section) => section.fields),
    ),
  ];
  return fields.some(
    (field) =>
      field.required &&
      (draft[field.name] == null ||
        draft[field.name] === "" ||
        (Array.isArray(draft[field.name]) &&
          !(draft[field.name] as unknown[]).length)),
  );
}

export async function quickCreateRelation(
  relation: ConfigRelation,
  name: string,
): Promise<{ record?: RelationRecord; requiresForm?: boolean }> {
  const draft = relationDraft(relation, name);
  if (requiresRelationForm(relation, draft)) return { requiresForm: true };
  // Check again at submission time; another user may have just created the name.
  const findExact = async () =>
    (await searchRelations(relation, name)).find(
      (record) =>
        String(record[relation.labelField]).trim().toLocaleLowerCase() ===
        name.trim().toLocaleLowerCase(),
    );
  const existing = await findExact();
  if (existing) return { record: existing };
  const writable = relation.formConfig?.writableFields;
  const payload = writable
    ? Object.fromEntries(writable.map((key) => [key, draft[key]]))
    : draft;
  const response = await apiFetch({
    url: base(relation),
    method: "POST",
    headers: headers(relation),
    payload: JSON.stringify(payload),
    suppressGlobalError: true,
  });
  if (response?.ok) return { record: await response.json() };
  if (response?.status === 409) {
    const duplicate = await findExact();
    if (duplicate) return { record: duplicate };
  }
  if (response?.status === 400 && relation.formConfig)
    return { requiresForm: true };
  throw new Error(
    response?.status === 403
      ? "You do not have permission to create this record."
      : "Could not create the record. Please try again.",
  );
}

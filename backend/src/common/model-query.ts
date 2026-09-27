import { BadRequestException } from '@nestjs/common';
import { SortOrder } from 'mongoose';

export interface ModelSearchOptions {
  domain?: [string, string, unknown][];
  fields?: string[];
  order?: string;
  limit?: number;
  offset?: number;
  search?: { query?: string; fields?: string[] };
  withCount?: boolean;
}
const invalid = (): never => {
  throw new BadRequestException('Invalid search options.');
};
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Allowlisted query construction; callers AND the returned filter with their access scope. */
export function buildModelQuery(
  raw: ModelSearchOptions,
  allowed: string[],
  searchable: string[],
) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid();
  if (
    Object.keys(raw).some(
      (key) =>
        ![
          'domain',
          'fields',
          'order',
          'limit',
          'offset',
          'search',
          'withCount',
        ].includes(key),
    )
  )
    invalid();
  const fieldOk = (field: unknown): field is string =>
    typeof field === 'string' && allowed.includes(field);
  const scalar = (value: unknown) =>
    value === null || ['string', 'number', 'boolean'].includes(typeof value);
  const filters: Record<string, unknown>[] = [];
  if (
    raw.domain !== undefined &&
    (!Array.isArray(raw.domain) || raw.domain.length > 50)
  )
    invalid();
  for (const term of raw.domain ?? []) {
    if (!Array.isArray(term) || term.length !== 3) invalid();
    const [field, operator, value] = term;
    if (!fieldOk(field)) invalid();
    if (operator === 'in' || operator === 'not in') {
      if (!Array.isArray(value) || value.length > 200 || !value.every(scalar))
        invalid();
      filters.push({
        [field]: { [operator === 'in' ? '$in' : '$nin']: value },
      });
    } else {
      if (!scalar(value)) invalid();
      const operators = {
        '=': '$eq',
        '!=': '$ne',
        '>': '$gt',
        '<': '$lt',
        '>=': '$gte',
        '<=': '$lte',
      };
      if (operator === 'contains') {
        if (!searchable.includes(field) || typeof value !== 'string') invalid();
        filters.push({
          [field]: { $regex: escapeRegex(value as string), $options: 'i' },
        });
      } else if (Object.hasOwn(operators, operator))
        filters.push({ [field]: { [operators[operator]]: value } });
      else invalid();
    }
  }
  if (raw.search !== undefined) {
    if (
      !raw.search ||
      typeof raw.search !== 'object' ||
      Array.isArray(raw.search) ||
      Object.keys(raw.search).some((k) => !['query', 'fields'].includes(k))
    )
      invalid();
    const query = raw.search.query ?? '';
    const fields = raw.search.fields ?? searchable;
    if (
      typeof query !== 'string' ||
      query.length > 500 ||
      !Array.isArray(fields) ||
      !fields.every((f) => searchable.includes(f))
    )
      invalid();
    if (query.trim() && fields.length)
      filters.push({
        $or: fields.map((field) => ({
          [field]: { $regex: escapeRegex(query.trim()), $options: 'i' },
        })),
      });
  }
  if (
    raw.fields !== undefined &&
    (!Array.isArray(raw.fields) || !raw.fields.every(fieldOk))
  )
    invalid();
  const sort: Record<string, SortOrder> = {};
  if (raw.order !== undefined && typeof raw.order !== 'string') invalid();
  for (const part of (raw.order || 'createdAt desc').split(',')) {
    const [field, direction = 'asc', extra] = part.trim().split(/\s+/);
    if (
      !fieldOk(field) ||
      !['asc', 'desc'].includes(direction.toLowerCase()) ||
      extra
    )
      invalid();
    sort[field] = direction.toLowerCase() === 'desc' ? -1 : 1;
  }
  sort._id ??= 1;
  const limit = raw.limit ?? 24,
    offset = raw.offset ?? 0;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 200 ||
    !Number.isInteger(offset) ||
    offset < 0
  )
    invalid();
  if (raw.withCount !== undefined && typeof raw.withCount !== 'boolean')
    invalid();
  return {
    filter: filters.length ? { $and: filters } : {},
    sort,
    limit,
    offset,
    fields: raw.fields ?? [],
  };
}

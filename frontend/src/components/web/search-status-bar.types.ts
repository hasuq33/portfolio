export type ViewFilterOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "in"
  | "not in"
  | "contains";

export interface ViewSearchField {
  name: string;
  label: string;
}

export interface ViewFilter {
  id: string;
  label: string;
  field: string;
  operator: ViewFilterOperator;
  value: unknown;
}

export interface ViewChoice {
  value: string;
  label: string;
}

export interface ViewSearchConfig {
  placeholder?: string;
  searchableFields?: ViewSearchField[];
  filterOptions?: ViewFilter[];
  groupByOptions?: ViewChoice[];
  viewOptions?: ViewChoice[];
  defaultView?: string | null;
}

export interface ViewSearchState {
  query: string;
  searchField: string | null;
  filters: ViewFilter[];
  groupBy: string | null;
  view: string | null;
}

export type ViewDomainCondition = [field: string, operator: ViewFilterOperator, value: unknown];

export const filtersToDomain = (filters: ViewFilter[]): ViewDomainCondition[] =>
  filters.map(({ field, operator, value }) => [field, operator, value]);

export const defaultViewSearchConfig: ViewSearchConfig = {
  placeholder: "Search records...",
  searchableFields: [],
  filterOptions: [],
  groupByOptions: [],
  viewOptions: [],
  defaultView: null,
};

export const createViewSearchState = (config: ViewSearchConfig = defaultViewSearchConfig): ViewSearchState => ({
  query: "",
  searchField: null,
  filters: [],
  groupBy: null,
  view: config.defaultView ?? config.viewOptions?.[0]?.value ?? null,
});

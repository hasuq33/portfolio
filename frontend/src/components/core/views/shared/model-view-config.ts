import type { FormNotebookPage, FormSectionConfig } from "./FormView";
import type { ViewSearchConfig } from "@/components/web/search-status-bar.types";

export interface ModelListField {
  name: string;
  label: string;
  kind?: "text" | "status" | "count" | "image" | "relation" | "date";
  trueLabel?: string;
  falseLabel?: string;
  choices?: Record<string, { label: string; tone?: "neutral" | "success" | "danger" }>;
  imageEndpoint?: string;
  primary?: boolean;
  className?: string;
}

export interface ModelViewConfig {
  baseDomain?: Array<[string, string, unknown]>;
  createOnlyFields?: string[];
  recordRoutes?: { field: string; routes: Record<string, string> };
  actions?: ModelRecordAction[];
  contextDefaults?: { companyField?: string; userField?: string };
  recordPermissionsField?: string;
  model: string;
  accessKey: string;
  route: string;
  title: string;
  singularTitle: string;
  description: string;
  labelField: string;
  subtitleField?: string;
  archiveField?: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  slug?: { source: string; field: string; availabilityEndpoint?: string };
  publicPath?: {
    base: string;
    categoryField?: string;
    categoryModel?: string;
    categorySlugField?: string;
  };
  images?: Array<{ field: string; presentField: string; endpoint: string }>;
  writableFields?: string[];
  search: ViewSearchConfig;
  list: {
    fields: ModelListField[];
    order?: string;
    pageSize?: number;
    sortOptions?: Array<{ label: string; value: string }>;
  };
  form: {
    defaults: Record<string, unknown>;
    sections: FormSectionConfig[];
    notebooks?: FormNotebookPage[];
  };
}

export interface ModelRecordAction {
  id: string;
  label: string;
  confirmation: string;
  endpoint: string;
  method?: "POST" | "DELETE";
  permission?: "write" | "delete";
  when?: Record<string, string | string[]>;
  payload?: Record<string, unknown>;
  reasonField?: { name: string; label: string };
  destructive?: boolean;
}

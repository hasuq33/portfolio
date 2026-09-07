import type { FormNotebookPage, FormSectionConfig } from "./FormView";
import type { ViewSearchConfig } from "@/components/web/search-status-bar.types";

export interface ModelListField {
  name: string;
  label: string;
  kind?: "text" | "status" | "count" | "image" | "relation" | "date";
  trueLabel?: string;
  falseLabel?: string;
  imageEndpoint?: string;
  primary?: boolean;
  className?: string;
}

export interface ModelViewConfig {
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
  };
  form: {
    defaults: Record<string, unknown>;
    sections: FormSectionConfig[];
    notebooks?: FormNotebookPage[];
  };
}

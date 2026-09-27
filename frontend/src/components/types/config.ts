export interface ConfigOption {
  label: string;
  value: string;
}

export interface ConfigRelation {
  apiBase?: string;
  companyField?: string;
  manageHref?: string;
  model: string;
  labelField: string;
  recordLabel?: string;
  recordLabelPlural?: string;
  valueField?: string;
  secondaryField?: string;
  searchFields?: string[];
  domain?: Array<[field: string, operator: string, value: unknown]>;
  order?: string;
  limit?: number;
}

export interface ConfigField {
  name: string;
  label: string;
  widget:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'textarea'
    | 'html'
    | 'image'
    | 'cover-image'
    | 'toggle'
    | 'switch'
    | 'select'
    | 'color'
    | 'url'
    | 'tel'
    | 'date'
    | 'tags'
    | 'many2many'
    | 'multi-select'
    | 'access-rights';

  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  readonlyAfterCreate?: boolean;
  prefix?: string;
  emptyLabel?: string;
  trueLabel?: string;
  falseLabel?: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  invisible?: boolean;
  autoFocus?: boolean;
  colSpan?: 1 | 2;
  helpText?: string;
  imageAccept?: string;
  imageMaxSizeMb?: number;
  imageFallback?: string;
  imageColorClassName?: string;
  options?: ConfigOption[];
  relation?: ConfigRelation;
  accessModels?: ConfigOption[];
}

export interface ConfigSection {
  title: string;
  description?: string;
  fields: ConfigField[];
}

export interface Configs {
  model: string;
  sections: ConfigSection[];
}

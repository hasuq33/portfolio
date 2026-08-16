export interface ConfigOption {
  label: string;
  value: string;
}

export interface ConfigField {
  name: string;
  label: string;
  widget:
    | 'text'
    | 'email'
    | 'password'
    | 'textarea'
    | 'image'
    | 'switch'
    | 'select'
    | 'color'
    | 'url'
    | 'tel'
    | 'date'
    | 'tags';

  placeholder?: string;
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

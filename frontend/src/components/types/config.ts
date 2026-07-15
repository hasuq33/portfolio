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
    | 'url';

  placeholder?: string;
  required?: boolean;
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
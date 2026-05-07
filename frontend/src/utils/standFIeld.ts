type DomainTuple = [string, string , any];

export interface FieldConfig {
  id:String;
  name: string;
  label?: string;
  type: string;
  editable?: boolean;
  widget?: string;
}

export interface StandardFieldProps {
  model: string;
  fields: FieldConfig[];
  domain: DomainTuple[];
  order: string;
  limit?:Number;
}
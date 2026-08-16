import { ConfigField } from "@/components/types/config";

export interface WidgetProps {
  field: ConfigField;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
  disabled?: boolean;
  error?: string;
  density?: "comfortable" | "compact";
  appearance?: "default" | "form" | "settings";
}

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
  /** Coordinates asynchronous widgets with the generic form actions. */
  onBusyChange?: (busy: boolean) => void;
  /** Clear local widget state/history when the parent discards a form. */
  resetKey?: number;
}

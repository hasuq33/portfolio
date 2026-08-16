import { ReactNode } from "react";

export type ModelRecord = Record<string, unknown> & { _id: string };

export interface ListColumn<TRecord> {
  id: string;
  label: string;
  className?: string;
  render: (record: TRecord) => ReactNode;
}

export interface RecordViewProps<TRecord> {
  records: TRecord[];
  getRecordId: (record: TRecord) => string;
  onOpenRecord: (record: TRecord) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

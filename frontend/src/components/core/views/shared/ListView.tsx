"use client";

import { KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { ListColumn, RecordViewProps } from "./types";

interface ListViewProps<TRecord> extends RecordViewProps<TRecord> {
  columns: ListColumn<TRecord>[];
}

export function ListView<TRecord>({
  records,
  columns,
  getRecordId,
  onOpenRecord,
  emptyTitle = "No records found",
  emptyDescription = "Try changing your search or filters.",
}: ListViewProps<TRecord>) {
  const openWithKeyboard = (event: KeyboardEvent<HTMLTableRowElement>, record: TRecord) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenRecord(record);
    }
  };

  if (!records.length) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col" className={`px-4 py-3 ${column.className ?? ""}`}>{column.label}</th>
              ))}
              <th scope="col" className="w-12 px-3 py-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((record) => (
              <tr
                key={getRecordId(record)}
                role="button"
                tabIndex={0}
                onClick={() => onOpenRecord(record)}
                onKeyDown={(event) => openWithKeyboard(event, record)}
                className="cursor-pointer outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {columns.map((column) => (
                  <td key={column.id} className={`px-4 py-3 ${column.className ?? ""}`}>{column.render(record)}</td>
                ))}
                <td className="px-3 py-3 text-muted-foreground"><ChevronRight className="size-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { KeyboardEvent, ReactNode } from "react";
import { RecordViewProps } from "./types";

interface KanbanViewProps<TRecord> extends RecordViewProps<TRecord> {
  renderCard: (record: TRecord) => ReactNode;
}

export function KanbanView<TRecord>({
  records,
  getRecordId,
  onOpenRecord,
  renderCard,
  emptyTitle = "No records found",
  emptyDescription = "Try changing your search or filters.",
}: KanbanViewProps<TRecord>) {
  const openWithKeyboard = (event: KeyboardEvent<HTMLDivElement>, record: TRecord) => {
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {records.map((record) => (
        <div
          key={getRecordId(record)}
          role="button"
          tabIndex={0}
          onClick={() => onOpenRecord(record)}
          onKeyDown={(event) => openWithKeyboard(event, record)}
          className="cursor-pointer rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {renderCard(record)}
        </div>
      ))}
    </div>
  );
}

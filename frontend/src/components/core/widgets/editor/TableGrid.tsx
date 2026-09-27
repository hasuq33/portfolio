import { useState } from "react";
import { Table2 } from "lucide-react";
import { ControlPopover } from "./EditorControls";
import type { HtmlEngine } from "./engine";

export function TableGrid({
  onChoose,
}: {
  onChoose: (rows: number, columns: number) => void;
}) {
  const [size, setSize] = useState({ rows: 2, columns: 2 });
  return (
    <div className="w-56">
      <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
        {size.rows} rows × {size.columns} columns
      </p>
      <div
        role="group"
        aria-label="Choose table dimensions"
        className="grid grid-cols-8 gap-1"
      >
        {Array.from({ length: 48 }, (_, index) => {
          const rows = Math.floor(index / 8) + 1,
            columns = (index % 8) + 1;
          return (
            <button
              key={index}
              type="button"
              aria-label={`${rows} rows by ${columns} columns`}
              title={`${rows} × ${columns}`}
              className={`size-6 cursor-pointer rounded-sm border focus-visible:outline-2 ${rows <= size.rows && columns <= size.columns ? "border-primary bg-primary/25" : "border-border bg-background"}`}
              onMouseEnter={() => setSize({ rows, columns })}
              onFocus={() => setSize({ rows, columns })}
              onClick={() => onChoose(rows, columns)}
              onKeyDown={(event) => {
                const offset = {
                  ArrowRight: 1,
                  ArrowLeft: -1,
                  ArrowDown: 8,
                  ArrowUp: -8,
                }[event.key];
                if (offset !== undefined) {
                  event.preventDefault();
                  (
                    event.currentTarget.parentElement?.children[
                      Math.max(0, Math.min(47, index + offset))
                    ] as HTMLElement
                  )?.focus();
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
export function TablePicker({
  editor,
  owner,
  onChoose,
}: {
  editor: HtmlEngine;
  owner: string;
  onChoose: (rows: number, columns: number) => void;
}) {
  return (
    <ControlPopover
      editor={editor}
      owner={owner}
      label="Choose table size"
      icon={<Table2 className="size-4" />}
    >
      {(close) => (
        <TableGrid
          onChoose={(rows, columns) => {
            onChoose(rows, columns);
            close();
          }}
        />
      )}
    </ControlPopover>
  );
}

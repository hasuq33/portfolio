import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Table2 } from "lucide-react";
import { FloatingPanel } from "./FloatingPanel";
import { ControlPopover, type RunCommand } from "./EditorControls";
import { simpleTable, type TableAction } from "./tables";
import type { HtmlEngine } from "./engine";

const actions: Array<[TableAction, string]> = [
  ["row-above", "Add row above"],
  ["row-below", "Add row below"],
  ["delete-row", "Delete row"],
  ["column-left", "Add column left"],
  ["column-right", "Add column right"],
  ["delete-column", "Delete column"],
  ["header-row", "Toggle header row"],
  ["header-column", "Toggle header column"],
  ["delete-table", "Delete table"],
];
type Handle = {
  axis: "column" | "row";
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  value: number;
};

export function TableControls({
  editor,
  table,
  owner,
  run,
  onBusyChange,
}: {
  editor: HtmlEngine;
  table: HTMLTableElement;
  owner: string;
  run: RunCommand;
  onBusyChange: (busy: boolean) => void;
}) {
  const [handles, setHandles] = useState<Handle[]>([]);
  const [rect, setRect] = useState<DOMRect>(() =>
    table.getBoundingClientRect(),
  );
  const [guide, setGuide] = useState<Handle | null>(null);
  const drag = useRef<null | (() => void)>(null);
  useEffect(() => {
    const measure = () => {
      if (!table.isConnected) return;
      const bounds = table.getBoundingClientRect();
      setRect(bounds);
      if (!simpleTable(table) || !bounds.width) {
        setHandles([]);
        return;
      }
      const columns = [...table.rows[0].cells]
        .slice(0, -1)
        .map((cell, index) => {
          const box = cell.getBoundingClientRect();
          return {
            axis: "column" as const,
            index,
            left: box.right - 4,
            top: bounds.top,
            width: 8,
            height: bounds.height,
            value: Math.round(box.width),
          };
        });
      const rows = [...table.rows].map((row, index) => {
        const box = row.getBoundingClientRect();
        return {
          axis: "row" as const,
          index,
          left: bounds.left,
          top: box.bottom - 4,
          width: bounds.width,
          height: 8,
          value: Math.round(box.height),
        };
      });
      setHandles([...columns, ...rows]);
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    editor.root.addEventListener("editorchange", measure);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(table);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      editor.root.removeEventListener("editorchange", measure);
      observer?.disconnect();
      drag.current?.();
    };
  }, [editor, table]);

  function begin(event: React.PointerEvent, handle: Handle) {
    event.preventDefault();
    event.stopPropagation();
    drag.current?.();
    const preview = editor.tables.resize(table, handle.axis, handle.index);
    editor.selection.hold();
    const start = handle.axis === "column" ? event.clientX : event.clientY;
    const previousSelect = document.body.style.userSelect,
      previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      handle.axis === "column" ? "col-resize" : "row-resize";
    onBusyChange(true);
    setGuide(handle);
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== event.pointerId) return;
      const delta =
        (handle.axis === "column" ? pointer.clientX : pointer.clientY) - start;
      preview.move(delta);
      const bounds =
        handle.axis === "column"
          ? table.rows[0].cells[handle.index].getBoundingClientRect()
          : table.rows[handle.index].getBoundingClientRect();
      setGuide({
        ...handle,
        left: handle.axis === "column" ? bounds.right - 4 : handle.left,
        top: handle.axis === "row" ? bounds.bottom - 4 : handle.top,
      });
    };
    const finish = (cancel = false) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("keydown", escape);
      document.body.style.userSelect = previousSelect;
      document.body.style.cursor = previousCursor;
      drag.current = null;
      if (cancel) preview.cancel();
      else preview.commit();
      editor.selection.release();
      setGuide(null);
      onBusyChange(false);
    };
    const up = (pointer: PointerEvent) => {
      if (pointer.pointerId === event.pointerId) finish();
    };
    const cancelDrag = () => finish(true);
    const escape = (key: KeyboardEvent) => {
      if (key.key === "Escape") {
        key.preventDefault();
        key.stopPropagation();
        finish(true);
      }
    };
    drag.current = cancelDrag;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("keydown", escape);
  }
  return (
    <>
      <FloatingPanel className="dark:bg-gray-800 bg-white" owner={owner} rect={rect} label="Table controls" below>
        <div className="flex items-center gap-1 px-1">
          <span className="text-xs text-muted-foreground">Table</span>
          <ControlPopover
            editor={editor}
            owner={owner}
            label="Table actions"
            icon={<Table2 className="size-4" />}
          >
            {(close) => (
              <div className="w-56">
                {!simpleTable(table) && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Merged cells are preserved. Row/column editing requires an
                    unmerged table.
                  </p>
                )}
                {actions.map(([action, label]) => (
                  <button
                    type="button"
                    key={action}
                    disabled={!simpleTable(table) && action !== "delete-table"}
                    onClick={() => {
                      run((e) => e.tables.action(action));
                      close();
                    }}
                    className="block w-full cursor-pointer rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:ring-2 disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </ControlPopover>
        </div>
      </FloatingPanel>
      {createPortal(
        <div data-editor-ui={owner}>
          {handles.map((handle) => (
            <div
              key={`${handle.axis}-${handle.index}`}
              role="separator"
              tabIndex={0}
              aria-label={`Resize ${handle.axis} ${handle.index + 1}`}
              aria-orientation={
                handle.axis === "column" ? "vertical" : "horizontal"
              }
              aria-valuenow={handle.value}
              aria-valuemin={handle.axis === "column" ? 56 : 28}
              className="fixed z-40 touch-none rounded hover:bg-primary/40 focus-visible:bg-primary/40 focus-visible:outline-none"
              style={{
                left: handle.left,
                top: handle.top,
                width: handle.width,
                height: handle.height,
                cursor: handle.axis === "column" ? "col-resize" : "row-resize",
              }}
              onPointerDown={(event) => begin(event, handle)}
              onKeyDown={(event) => {
                const keys: Record<string, number> =
                  handle.axis === "column"
                    ? { ArrowLeft: -8, ArrowRight: 8 }
                    : { ArrowUp: -8, ArrowDown: 8 };
                const delta = keys[event.key];
                if (delta !== undefined) {
                  event.preventDefault();
                  run((e) => {
                    const preview = e.tables.resize(
                      table,
                      handle.axis,
                      handle.index,
                    );
                    preview.move(delta);
                    preview.commit();
                  });
                }
              }}
            />
          ))}
          {guide && (
            <div
              className="pointer-events-none fixed z-50 bg-primary"
              style={{
                left: guide.left + (guide.axis === "column" ? 3 : 0),
                top: guide.top + (guide.axis === "row" ? 3 : 0),
                width: guide.axis === "column" ? 2 : guide.width,
                height: guide.axis === "row" ? 2 : guide.height,
              }}
            />
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

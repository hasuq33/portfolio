import type { HtmlEngine } from "./engine";

export type TableAction =
  | "row-above"
  | "row-below"
  | "delete-row"
  | "column-left"
  | "column-right"
  | "delete-column"
  | "delete-table"
  | "header-row"
  | "header-column";
export function simpleTable(table: HTMLTableElement) {
  const rows = [...table.rows];
  return (
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.cells.length === rows[0].cells.length &&
        [...row.cells].every(
          (cell) => cell.colSpan === 1 && cell.rowSpan === 1,
        ),
    )
  );
}
function cell(tag = "td") {
  const element = document.createElement(tag) as HTMLTableCellElement;
  element.innerHTML = "<p><br></p>";
  return element;
}

export class TableCommands {
  constructor(private readonly editor: HtmlEngine) {}
  current() {
    const element = this.editor.element();
    const table = element?.closest<HTMLTableElement>("table");
    if (!table || !this.editor.root.contains(table)) return null;
    return {
      table,
      cell:
        element?.closest<HTMLTableCellElement>("td,th") ??
        table.rows[0]?.cells[0],
    };
  }
  insert(rows = 2, columns = 2) {
    this.editor.transaction(() => {
      const table = document.createElement("table");
      const body = table.createTBody();
      for (
        let r = 0;
        r < Math.min(20, Math.max(1, Math.floor(rows) || 2));
        r++
      ) {
        const row = body.insertRow();
        for (
          let c = 0;
          c < Math.min(12, Math.max(1, Math.floor(columns) || 2));
          c++
        )
          row.append(cell());
      }
      this.editor.insertBlock(table);
      this.editor.focus(table.rows[0].cells[0].firstChild!);
    });
  }
  action(action: TableAction) {
    const context = this.current();
    if (!context) return;
    const { table, cell: selected } = context;
    if (action !== "delete-table" && !simpleTable(table))
      throw Error(
        "Row and column editing is available for rectangular tables without merged cells.",
      );
    this.editor.transaction(() => {
      if (action === "delete-table") {
        const paragraph = document.createElement("p");
        paragraph.append(document.createElement("br"));
        table.replaceWith(paragraph);
        this.editor.focus(paragraph);
        return;
      }
      if (!selected) return;
      const row = selected.parentElement as HTMLTableRowElement;
      const ri = row.rowIndex,
        ci = selected.cellIndex;
      let target: HTMLTableCellElement | undefined = selected;
      if (action === "row-above" || action === "row-below") {
        const next = document.createElement("tr");
        [...row.cells].forEach((old, index) =>
          next.append(
            cell(
              index === 0 &&
                old.tagName === "TH" &&
                table.rows[1]?.cells[0]?.tagName === "TH"
                ? "th"
                : "td",
            ),
          ),
        );
        if (action === "row-above") row.before(next);
        else row.after(next);
        target = next.cells[ci];
      } else if (action === "delete-row") {
        if (table.rows.length === 1) {
          this.action("delete-table");
          return;
        }
        row.remove();
        target = table.rows[Math.min(ri, table.rows.length - 1)].cells[ci];
      } else if (action === "column-left" || action === "column-right") {
        const index = ci + (action === "column-right" ? 1 : 0);
        for (const r of [...table.rows]) {
          const next = cell(
            [...r.cells].every((c) => c.tagName === "TH") ? "th" : "td",
          );
          r.insertBefore(next, r.cells[index] ?? null);
        }
        table.querySelector(":scope > colgroup")?.remove();
        target = row.cells[index];
      } else if (action === "delete-column") {
        if (row.cells.length === 1) {
          this.action("delete-table");
          return;
        }
        for (const r of [...table.rows]) r.cells[ci].remove();
        table.querySelector(":scope > colgroup")?.remove();
        target = row.cells[Math.min(ci, row.cells.length - 1)];
      } else {
        const cells =
          action === "header-row"
            ? [...table.rows[0].cells]
            : [...table.rows].map((r) => r.cells[0]);
        const tag = cells.every((c) => c.tagName === "TH") ? "td" : "th";
        for (const old of cells) {
          const next = document.createElement(tag) as HTMLTableCellElement;
          next.style.cssText = old.style.cssText;
          if (tag === "th")
            next.scope = action === "header-row" ? "col" : "row";
          next.append(...old.childNodes);
          old.replaceWith(next);
          if (old === selected) target = next;
        }
      }
      if (target) this.editor.focus(target.firstChild ?? target);
    });
  }
  tab(backwards: boolean) {
    const context = this.current();
    if (!context?.cell) return false;
    const cells = [...context.table.rows].flatMap((row) => [...row.cells]);
    const index = cells.indexOf(context.cell) + (backwards ? -1 : 1);
    if (index < 0) return false; // Leave the editor at its first cell with Shift+Tab.
    if (index === cells.length) {
      if (!simpleTable(context.table)) return false;
      this.action("row-below");
      const first = context.table.rows[context.table.rows.length - 1].cells[0];
      this.editor.focus(first.firstChild ?? first);
    } else this.editor.focus(cells[index].firstChild ?? cells[index]);
    return true;
  }
  resize(table: HTMLTableElement, axis: "column" | "row", index: number) {
    if (!simpleTable(table) || !this.editor.root.contains(table))
      throw Error("This table cannot be resized.");
    const preview = this.editor.preview();
    if (axis === "row") {
      const row = table.rows[index];
      if (!row) {
        preview.cancel();
        throw Error("Choose a valid row boundary.");
      }
      const initial =
        row.getBoundingClientRect().height ||
        parseFloat(row.style.height) ||
        36;
      return {
        ...preview,
        move: (delta: number) => {
          row.style.height = `${Math.round(Math.max(28, Math.min(1000, initial + delta)))}px`;
        },
      };
    }
    const count = table.rows[0].cells.length;
    if (index < 0 || index >= count - 1) {
      preview.cancel();
      throw Error("Choose an internal column boundary.");
    }
    const width = table.getBoundingClientRect().width || 600;
    let group = table.querySelector<HTMLTableColElement>(":scope > colgroup");
    if (!group) {
      group = document.createElement("colgroup");
      table.prepend(group);
    }
    while (group.children.length < count)
      group.append(document.createElement("col"));
    const widths = [...table.rows[0].cells].map(
      (c, i) =>
        c.getBoundingClientRect().width ||
        (parseFloat((group!.children[i] as HTMLElement).style.width) / 100) *
          width ||
        width / count,
    );
    return {
      ...preview,
      move: (delta: number) => {
        const min = Math.min(56, (widths[index] + widths[index + 1]) / 2);
        const clamped = Math.max(
          min - widths[index],
          Math.min(widths[index + 1] - min, delta),
        );
        widths.forEach((w, i) => {
          const px =
            w + (i === index ? clamped : i === index + 1 ? -clamped : 0);
          (group!.children[i] as HTMLElement).style.width =
            `${+((px / width) * 100).toFixed(3)}%`;
        });
      },
    };
  }
}

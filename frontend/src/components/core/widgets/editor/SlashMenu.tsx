import { FloatingPanel } from "./FloatingPanel";
import { TablePicker } from "./TableGrid";
import type { HtmlEngine } from "./engine";
export type SlashCommand = {
  id: string;
  label: string;
  kind: "block" | "list" | "insert" | "image" | "icon" | "link";
};
export const slashCommands: SlashCommand[] = [
  ...[1, 2, 3, 4, 5, 6].map((level) => ({
    id: `h${level}`,
    label: `Heading ${level}`,
    kind: "block" as const,
  })),
  { id: "p", label: "Paragraph", kind: "block" },
  { id: "ul", label: "Bullet List", kind: "list" },
  { id: "ol", label: "Numbered List", kind: "list" },
  { id: "blockquote", label: "Quote", kind: "block" },
  { id: "pre", label: "Code Block", kind: "block" },
  { id: "divider", label: "Divider", kind: "insert" },
  { id: "table", label: "Table", kind: "insert" },
  { id: "image", label: "Upload image", kind: "image" },
  { id: "icon", label: "React icon", kind: "icon" },
  { id: "link", label: "Link", kind: "link" },
  ...[2, 3, 4].map((count) => ({
    id: `columns-${count}`,
    label: `${count} columns`,
    kind: "insert" as const,
  })),
  ...["info", "success", "warning", "danger"].map((kind) => ({
    id: kind,
    label: `${kind} notice`,
    kind: "insert" as const,
  })),
];
export function filterCommands(query: string) {
  const term = query.trim().toLowerCase();
  return slashCommands.filter(
    (command) =>
      command.label.toLowerCase().includes(term) || command.id.includes(term),
  );
}
export function SlashMenu({
  editor,
  owner,
  rect,
  query,
  active,
  onActive,
  onChoose,
  id,
}: {
  editor: HtmlEngine;
  owner: string;
  rect: DOMRect;
  query: string;
  active: number;
  onActive: (index: number) => void;
  onChoose: (command: SlashCommand, rows?: number, columns?: number) => void;
  id: string;
}) {
  const matches = filterCommands(query);
  return (
    <FloatingPanel className="dark:bg-gray-800 bg-white" owner={owner} rect={rect} label="Block commands" below>
      <div
        id={id}
        role="listbox"
        aria-label="Insert a block"
        className="max-h-[min(18rem,40vh)] w-64 max-w-[calc(100vw-24px)] overflow-y-auto"
      >
        {matches.map((command, index) => (
          <button
            id={`${id}-${command.id}`}
            key={command.id}
            role="option"
            type="button"
            aria-selected={index === active}
            className={`block w-full cursor-pointer rounded px-3 py-2 text-left text-sm ${index === active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActive(index)}
            onClick={() => onChoose(command)}
          >
            {command.label}
          </button>
        ))}
        {!matches.length && (
          <p className="p-3 text-sm text-muted-foreground">
            No matching commands.
          </p>
        )}
      </div>
      {query.toLowerCase().includes("table") && (
        <div className="flex items-center justify-between border-t px-2 pt-1 text-xs text-muted-foreground">
          Choose dimensions
          <TablePicker
            editor={editor}
            owner={owner}
            onChoose={(r, c) =>
              onChoose({ id: "table", label: "Table", kind: "insert" }, r, c)
            }
          />
        </div>
      )}
    </FloatingPanel>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { editorIcons, type EditorIconName } from "@/lib/editor-icons";
import { apiFetch } from "@/lib/orm_service";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import type { WidgetProps } from "./types";
import { HtmlEngine } from "./editor/engine";
import { sanitizeEditorHtml } from "./editor/sanitize";
import { useEditorSelection } from "./editor/useEditorSelection";
import { useImageUpload } from "./editor/useImageUpload";
import { FloatingToolbar } from "./editor/FloatingToolbar";
import { LinkEditor } from "./editor/LinkEditor";
import {
  SlashMenu,
  filterCommands,
  type SlashCommand,
} from "./editor/SlashMenu";
import { TableControls } from "./editor/TableControls";
import "./editor/rich-content.css";
import "./editor/editor-content.css";

export function HtmlWidget({
  field,
  value,
  onChange,
  readonly,
  disabled,
  error,
  density = "comfortable",
  appearance,
  onBusyChange,
  resetKey = 0,
}: WidgetProps) {
  const owner = useId();
  const root = useRef<HTMLDivElement>(null);
  const engine = useRef<HtmlEngine | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const callbacks = useRef({ onChange, onBusyChange });
  const lastValue = useRef<string | null>(null);
  const previousReset = useRef(resetKey);
  const revision = useRef(0);
  const composing = useRef(false);
  const retriedImages = useRef(new WeakSet<HTMLImageElement>());
  const [isComposing, setComposing] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [dialog, setDialog] = useState<"link" | "icon" | null>(null);
  const [active, setActive] = useState(0);
  const locked = Boolean(readonly || disabled);
  const { busy: uploading, upload } = useImageUpload(
    engine,
    revision,
    locked,
    setLocalError,
  );
  const busy = uploading || resizing;
  const editable = !locked && !busy;
  const message = error || localError;
  const menuId = owner + "-commands";

  useEffect(() => {
    callbacks.current = { onChange, onBusyChange };
  }, [onChange, onBusyChange]);
  useEffect(() => {
    if (!root.current) return;
    engine.current = new HtmlEngine(root.current, (html) => {
      lastValue.current = html;
      callbacks.current.onChange?.(html);
    });
    lastValue.current = null;
    return () => {
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    callbacks.current.onBusyChange?.(busy);
    return () => callbacks.current.onBusyChange?.(false);
  }, [busy]);
  useEffect(() => {
    const incoming = typeof value === "string" ? value : "";
    if (incoming === lastValue.current && previousReset.current === resetKey)
      return;
    previousReset.current = resetKey;
    lastValue.current = incoming;
    revision.current++;
    engine.current?.setExternal(sanitizeEditorHtml(incoming));
    setDialog(null);
    setLocalError("");
  }, [value, resetKey]);

  const { view, dismiss } = useEditorSelection(
    engine,
    !locked && !uploading && !dialog && !isComposing,
    owner,
  );
  const matches = filterCommands(view?.slash?.query ?? "");
  useEffect(() => {
    setActive(0);
  }, [view?.slash?.query]);
  useEffect(() => {
    if (view?.slash && matches[active])
      document
        .getElementById(menuId + "-" + matches[active].id)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, view?.slash?.query, menuId]);

  const run = (action: (editor: HtmlEngine) => void) => {
    if (!editable || !engine.current) return;
    try {
      setLocalError("");
      const editor = engine.current;
      editor.select(editor.range());
      action(editor);
      editor.changed();
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : "The action failed.",
      );
    }
  };
  const openDialog = (kind: "link" | "icon") => {
    if (!editable) return;
    engine.current?.selection.hold();
    setDialog(kind);
    dismiss();
  };
  const closeDialog = () => {
    setDialog(null);
    engine.current?.selection.release();
  };

  useEffect(() => {
    const element = root.current;
    const beforeInput = (event: InputEvent) => {
      const editor = engine.current;
      if (!editable || !editor) {
        event.preventDefault();
        return;
      }
      if (
        event.inputType === "historyUndo" ||
        event.inputType === "historyRedo"
      ) {
        event.preventDefault();
        if (event.inputType === "historyUndo") editor.undo();
        else editor.redo();
      } else if (event.inputType?.startsWith("format")) {
        event.preventDefault();
        const kind = {
          formatBold: "bold",
          formatItalic: "italic",
          formatUnderline: "underline",
          formatStrikeThrough: "strike",
        }[event.inputType];
        if (kind)
          editor.format(kind as "bold" | "italic" | "underline" | "strike");
      } else if (event.inputType === "insertParagraph" && editor.enterList()) {
        event.preventDefault();
      } else if (!composing.current) editor.beforeInput();
    };
    element?.addEventListener("beforeinput", beforeInput);
    return () => element?.removeEventListener("beforeinput", beforeInput);
  }, [editable]);

  function execute(command: SlashCommand, rows = 2, columns = 2) {
    run((editor) =>
      editor.transaction(() => {
        if (view?.slash) {
          editor.select(view.slash.range);
          editor.insertText("");
        }
        dismiss();
        if (command.kind === "block") editor.block(command.id);
        else if (command.kind === "list")
          editor.list(command.id as "ul" | "ol");
        else if (command.kind === "link" || command.kind === "icon")
          openDialog(command.kind);
        else if (command.kind === "image") fileInput.current?.click();
        else if (command.id === "table") editor.tables.insert(rows, columns);
        else if (command.id === "divider")
          editor.insertBlock(document.createElement("hr"));
        else {
          const container = document.createElement("div");
          if (command.id.startsWith("columns-")) {
            container.className = "editor-" + command.id;
            for (let index = 0; index < Number(command.id.slice(-1)); index++) {
              const column = document.createElement("div");
              column.innerHTML = "<p><br></p>";
              container.append(column);
            }
          } else {
            container.className = "editor-banner-" + command.id;
            const paragraph = document.createElement("p");
            paragraph.textContent = command.label;
            container.append(paragraph);
          }
          editor.insertBlock(container);
        }
      }),
    );
  }

  function insertIcon(name: EditorIconName) {
    run((editor) => {
      const image = document.createElement("img");
      image.src = "/editor-icons/" + name;
      image.alt = name;
      image.className = "editor-icon";
      image.width = 24;
      image.height = 24;
      editor.insertInline(image);
      closeDialog();
    });
  }

  return (
    <FieldShell
      field={field}
      appearance={appearance}
      density={density}
      error={message}
      disabled={disabled}
    >
      <div className="min-w-0 rounded-lg border border-border bg-white dark:bg-gray-800">
        {!locked && (
          <div className="flex items-center gap-1 border-b p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Undo (Ctrl/Cmd+Z)"
              aria-label="Undo"
              disabled={busy}
              className="cursor-pointer"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run((editor) => editor.undo())}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Redo (Ctrl/Cmd+Shift+Z)"
              aria-label="Redo"
              disabled={busy}
              className="cursor-pointer"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run((editor) => editor.redo())}
            >
              <Redo2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className="cursor-pointer gap-1.5"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                engine.current?.rememberSelection();
                fileInput.current?.click();
              }}
            >
              <ImagePlus className="size-4" />
              {uploading ? "Uploading…" : "Image"}
            </Button>
            <span className="ml-auto hidden pr-2 text-xs text-muted-foreground sm:inline">
              Select text to format · / for blocks
            </span>
          </div>
        )}
        <div
          ref={root}
          id={field.name}
          role="textbox"
          aria-label={field.label}
          aria-multiline="true"
          aria-required={Boolean(field.required)}
          aria-readonly={Boolean(readonly)}
          aria-disabled={Boolean(disabled || busy)}
          aria-busy={busy}
          aria-invalid={Boolean(message)}
          aria-describedby={
            message
              ? getFieldErrorId(field.name)
              : field.helpText
                ? getFieldHelpId(field.name)
                : undefined
          }
          aria-controls={view?.slash ? menuId : undefined}
          aria-activedescendant={
            view?.slash && matches[active]
              ? menuId + "-" + matches[active].id
              : undefined
          }
          contentEditable={editable}
          suppressContentEditableWarning
          tabIndex={disabled ? -1 : 0}
          spellCheck
          className={[
            "rich-content editor-content min-h-[320px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            density === "compact" ? "p-3" : "p-4",
            disabled ? "opacity-80" : "",
          ].join(" ")}
          onInput={() => {
            if (editable && !composing.current) engine.current?.commit();
          }}
          onCompositionStart={() => {
            composing.current = true;
            setComposing(true);
            engine.current?.beforeInput();
          }}
          onCompositionEnd={() => {
            composing.current = false;
            setComposing(false);
            if (editable) engine.current?.commit();
          }}
          onPaste={(event) => {
            event.preventDefault();
            if (!editable) return;
            const html = event.clipboardData.getData("text/html");
            run((editor) =>
              html
                ? editor.insertHtml(sanitizeEditorHtml(html))
                : editor.insertText(event.clipboardData.getData("text/plain")),
            );
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (editable)
              setLocalError("Use the Image button to upload an image.");
          }}
          onClick={(event) => {
            if (
              editable &&
              event.target instanceof Element &&
              event.target.closest("a")
            )
              event.preventDefault();
          }}
          onErrorCapture={(event) => {
            const image = event.target;
            if (
              !(image instanceof HTMLImageElement) ||
              retriedImages.current.has(image)
            )
              return;
            const source = image.getAttribute("src") ?? "";
            const match = source.match(/^\/editor-media\/([a-f\d]{24})$/);
            if (!match) return;
            retriedImages.current.add(image);
            void apiFetch({
              url: "/attachments/images/" + match[1],
              suppressGlobalError: true,
            }).then((response) => {
              if (response?.ok && root.current?.contains(image))
                image.src = source;
              void response?.body?.cancel();
            });
          }}
          onKeyDown={(event) => {
            if (!editable || event.nativeEvent.isComposing) return;
            if (event.key === "Escape" && view) {
              event.preventDefault();
              event.stopPropagation();
              dismiss();
              return;
            }
            if (
              view?.slash &&
              matches.length &&
              ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)
            ) {
              event.preventDefault();
              event.stopPropagation();
              if (event.key === "Enter") execute(matches[active] ?? matches[0]);
              else
                setActive(
                  (index) =>
                    (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      matches.length) %
                    matches.length,
                );
              return;
            }
            if (
              event.key === "Tab" &&
              engine.current?.tables.tab(event.shiftKey)
            ) {
              event.preventDefault();
              return;
            }
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              engine.current?.enterList()
            ) {
              event.preventDefault();
              return;
            }
            const key = event.key.toLowerCase();
            if (
              (event.ctrlKey || event.metaKey) &&
              ["b", "i", "u", "k", "z", "y"].includes(key)
            ) {
              event.preventDefault();
              event.stopPropagation();
              if (key === "k") {
                openDialog("link");
                return;
              }
              run((editor) => {
                if (key === "b") editor.format("bold");
                if (key === "i") editor.format("italic");
                if (key === "u") editor.format("underline");
                if (key === "z") {
                  if (event.shiftKey) editor.redo();
                  else editor.undo();
                }
                if (key === "y") editor.redo();
              });
            }
            if (event.key === "/") event.stopPropagation();
          }}
        />
        <p className="sr-only" aria-live="polite">
          {busy
            ? uploading
              ? "Uploading image. Please wait."
              : "Resizing table."
            : ""}
        </p>
      </div>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
      {view?.showToolbar && editable && engine.current && (
        <FloatingToolbar
          editor={engine.current}
          owner={owner}
          state={view.state}
          rect={view.rect}
          run={run}
          onLink={() => openDialog("link")}
          onDismiss={dismiss}
        />
      )}
      {view?.slash && editable && engine.current && (
        <SlashMenu
          editor={engine.current}
          owner={owner}
          id={menuId}
          rect={view.rect}
          query={view.slash.query}
          active={active}
          onActive={setActive}
          onChoose={execute}
        />
      )}
      {view?.state.table && !locked && !uploading && engine.current && (
        <TableControls
          editor={engine.current}
          table={view.state.table}
          owner={owner}
          run={run}
          onBusyChange={setResizing}
        />
      )}
      {dialog === "link" && engine.current && (
        <LinkEditor
          editor={engine.current}
          owner={owner}
          onClose={closeDialog}
        />
      )}
      <Dialog
        open={dialog === "icon"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent
          data-editor-ui={owner}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const editor = engine.current;
            if (editor) editor.select(editor.range());
          }}
        >
          <DialogHeader>
            <DialogTitle>Insert icon</DialogTitle>
            <DialogDescription>
              Choose an icon for the current selection.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(editorIcons).map(([name, Icon]) => (
              <Button
                key={name}
                type="button"
                variant="outline"
                className="cursor-pointer gap-2"
                onClick={() => insertIcon(name as EditorIconName)}
              >
                <Icon aria-hidden="true" />
                {name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </FieldShell>
  );
}

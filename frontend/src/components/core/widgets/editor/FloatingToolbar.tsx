import { useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  CaseSensitive,
  List,
  ListOrdered,
  Link2,
  MoreHorizontal,
  RemoveFormatting,
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";
import { FloatingPanel } from "./FloatingPanel";
import {
  ChoiceMenu,
  ControlPopover,
  ToolButton,
  type RunCommand,
} from "./EditorControls";
import { ColorPicker } from "./ColorPicker";
import { AiActions } from "./AiActions";
import { TablePicker } from "./TableGrid";
import { FONT_FAMILIES, FONT_SIZES, type FormattingState } from "./formatting";
import type { HtmlEngine } from "./engine";

export function FloatingToolbar({
  editor,
  state,
  rect,
  owner,
  run,
  onLink,
  onDismiss,
}: {
  editor: HtmlEngine;
  state: FormattingState;
  rect: DOMRect;
  owner: string;
  run: RunCommand;
  onLink: () => void;
  onDismiss: () => void;
}) {
  const [size, setSize] = useState("");
  const alignmentIcons = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
    justify: AlignJustify,
  };
  const AlignIcon =
    alignmentIcons[state.alignment as keyof typeof alignmentIcons] ?? AlignLeft;
  const font = (
    <ChoiceMenu
      editor={editor}
      owner={owner}
      label="Font family"
      icon={<CaseSensitive className="size-4" />}
      value={
        FONT_FAMILIES.find((family) => family === state.fontFamily) ?? "inherit"
      }
      options={FONT_FAMILIES.map((value) => ({
        value,
        label: value === "inherit" ? "Default font" : value,
      }))}
      onSelect={(value) =>
        run((e) => e.mark("font-family", value === "inherit" ? "" : value))
      }
    />
  );
  const fontSize = (
    <ControlPopover
      editor={editor}
      owner={owner}
      label="Font size"
      icon={
        <span className="text-xs tabular-nums">
          {Math.round(state.fontSize)}
        </span>
      }
    >
      {(close) => (
        <div className="w-48">
          <div className="mb-3 grid grid-cols-4 gap-1">
            {FONT_SIZES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={state.fontSize === value}
                className={`cursor-pointer rounded px-2 py-1 text-sm hover:bg-accent ${state.fontSize === value ? "bg-accent" : ""}`}
                onClick={() => {
                  run((e) => e.fontSize(value));
                  close();
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="text-xs">
            Custom size (8–120 px)
            <input
              type="number"
              min={8}
              max={120}
              aria-label="Custom font size"
              value={size}
              placeholder={String(Math.round(state.fontSize))}
              onChange={(event) => setSize(event.target.value)}
              className="mt-1 w-full rounded border bg-background p-2"
            />
          </label>
          <button
            type="button"
            className="mt-2 w-full cursor-pointer rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            onClick={() => {
              run((e) => e.fontSize(Number(size || state.fontSize)));
              if (
                Number(size || state.fontSize) >= 8 &&
                Number(size || state.fontSize) <= 120
              )
                close();
            }}
          >
            Apply
          </button>
        </div>
      )}
    </ControlPopover>
  );
  const alignment = (
    <ChoiceMenu
      editor={editor}
      owner={owner}
      label="Alignment"
      icon={<AlignIcon className="size-4" />}
      value={state.alignment}
      options={[
        { value: "left", label: "Align Left" },
        { value: "center", label: "Align Center" },
        { value: "right", label: "Align Right" },
        { value: "justify", label: "Justify" },
      ]}
      onSelect={(value) =>
        run((e) => e.align(value as "left" | "center" | "right" | "justify"))
      }
    />
  );
  const lists = (
    <ChoiceMenu
      editor={editor}
      owner={owner}
      label="Lists"
      icon={
        state.list === "ol" ? (
          <ListOrdered className="size-4" />
        ) : (
          <List className="size-4" />
        )
      }
      value={state.list}
      options={[
        { value: "ul", label: "Bullet List" },
        { value: "ol", label: "Numbered List" },
      ]}
      onSelect={(value) => run((e) => e.list(value as "ul" | "ol"))}
    />
  );
  const highlight = (
    <ColorPicker
      editor={editor}
      owner={owner}
      run={run}
      highlight
      current={state.highlight}
    />
  );
  return (
    <FloatingPanel rect={rect} owner={owner} label="Text formatting">
      <div
        className="flex flex-wrap items-center gap-0.5 dark:bg-gray-800 bg-white"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onDismiss();
            editor.select(editor.range());
          }
        }}
      >
        <ToolButton
          label="Bold (Ctrl/Cmd+B)"
          active={state.bold}
          onClick={() => run((e) => e.format("bold"))}
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          label="Italic (Ctrl/Cmd+I)"
          active={state.italic}
          onClick={() => run((e) => e.format("italic"))}
        >
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton
          label="Underline (Ctrl/Cmd+U)"
          active={state.underline}
          onClick={() => run((e) => e.format("underline"))}
        >
          <Underline className="size-4" />
        </ToolButton>
        <ChoiceMenu
          editor={editor}
          owner={owner}
          label="Text style"
          icon={<Type className="size-4" />}
          value={state.tag}
          options={[
            { value: "p", label: "Paragraph" },
            ...[1, 2, 3, 4, 5, 6].map((level) => ({
              value: `h${level}`,
              label: `Heading ${level}`,
            })),
            { value: "blockquote", label: "Blockquote" },
            { value: "pre", label: "Code Block" },
          ]}
          onSelect={(value) => run((e) => e.block(value))}
        />
        <div className="hidden items-center gap-0.5 sm:flex">
          {font}
          {fontSize}
        </div>
        <ColorPicker
          editor={editor}
          owner={owner}
          run={run}
          current={state.color}
        />
        <div className="hidden items-center gap-0.5 sm:flex">
          {highlight}
          {lists}
          {alignment}
        </div>
        <ToolButton
          label="Edit link (Ctrl/Cmd+K)"
          active={Boolean(state.link)}
          onClick={onLink}
        >
          <Link2 className="size-4" />
        </ToolButton>
        <AiActions editor={editor} owner={owner} />
        <ControlPopover
          editor={editor}
          owner={owner}
          label="More formatting"
          icon={<MoreHorizontal className="size-4" />}
        >
          {(close) => (
            <div className="w-56 space-y-2">
              <div className="flex flex-wrap gap-1 sm:hidden">
                {font}
                {fontSize}
                {highlight}
                {lists}
                {alignment}
              </div>
              <div className="flex gap-1">
                <ToolButton
                  label="Strikethrough"
                  active={state.strike}
                  onClick={() => {
                    run((e) => e.format("strike"));
                    close();
                  }}
                >
                  <Strikethrough className="size-4" />
                </ToolButton>
                <ToolButton
                  label="Clear formatting"
                  onClick={() => {
                    run((e) => e.clearFormatting());
                    close();
                  }}
                >
                  <RemoveFormatting className="size-4" />
                </ToolButton>
                <ToolButton
                  label="Increase indent"
                  onClick={() => {
                    run((e) => e.indent(1));
                    close();
                  }}
                >
                  <IndentIncrease className="size-4" />
                </ToolButton>
                <ToolButton
                  label="Decrease indent"
                  onClick={() => {
                    run((e) => e.indent(-1));
                    close();
                  }}
                >
                  <IndentDecrease className="size-4" />
                </ToolButton>
                <TablePicker
                  editor={editor}
                  owner={owner}
                  onChoose={(r, c) => {
                    run((e) => e.tables.insert(r, c));
                    close();
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: use / at the start of an empty block to insert content.
              </p>
            </div>
          )}
        </ControlPopover>
      </div>
    </FloatingPanel>
  );
}

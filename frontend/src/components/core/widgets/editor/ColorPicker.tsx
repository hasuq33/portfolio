import { useEffect, useState } from "react";
import { Baseline, Highlighter } from "lucide-react";
import { ControlPopover, type RunCommand } from "./EditorControls";
import type { HtmlEngine } from "./engine";

const HEX = /^#[a-f\d]{6}$/i;
export const TEXT_COLORS_KEY = "nova_editor_recent_text_colors";
export const HIGHLIGHT_COLORS_KEY = "nova_editor_recent_highlight_colors";
export function readRecentColors(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (color): color is string =>
              typeof color === "string" && HEX.test(color),
          )
          .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
export function rememberColor(key: string, color: string) {
  const recent = [
    color.toLowerCase(),
    ...readRecentColors(key).filter(
      (value) => value.toLowerCase() !== color.toLowerCase(),
    ),
  ].slice(0, 10);
  try {
    localStorage.setItem(key, JSON.stringify(recent));
  } catch {
    /* Storage may be disabled. */
  }
  return recent;
}
const textPalette = [
  "#171717",
  "#ffffff",
  "#64748b",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#9333ea",
  "#db2777",
  "#854d0e",
];
const highlights = [
  "#fef08a",
  "#fed7aa",
  "#fecaca",
  "#bbf7d0",
  "#a5f3fc",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
];

export function ColorPicker({
  editor,
  owner,
  run,
  highlight = false,
  current,
}: {
  editor: HtmlEngine;
  owner: string;
  run: RunCommand;
  highlight?: boolean;
  current?: string;
}) {
  const key = highlight ? HIGHLIGHT_COLORS_KEY : TEXT_COLORS_KEY;
  const [recent, setRecent] = useState<string[]>([]);
  const [custom, setCustom] = useState(highlight ? "#fef08a" : "#3586c0");
  useEffect(() => setRecent(readRecentColors(key)), [key]);
  const Icon = highlight ? Highlighter : Baseline;
  return (
    <ControlPopover
      editor={editor}
      owner={owner}
      label={highlight ? "Highlight color" : "Text color"}
      icon={
        <span
          className="border-b-[3px]"
          style={{ borderColor: current || custom }}
        >
          <Icon className="size-4" />
        </span>
      }
    >
      {(close) => {
        const choose = (color: string) => {
          if (color && !HEX.test(color)) return;
          run((e) => e.mark(highlight ? "background-color" : "color", color));
          if (color) setRecent(rememberColor(key, color));
          close();
        };
        const swatches = (colors: string[]) => (
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`${highlight ? "Highlight" : "Text"} ${color}`}
                onClick={() => choose(color)}
                style={{ backgroundColor: color }}
                className="size-7 cursor-pointer rounded border border-border shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            ))}
          </div>
        );
        return (
          <div className="w-52 space-y-3">
            {recent.length > 0 && (
              <section aria-label="Recent colors">
                <p className="mb-2 text-xs text-muted-foreground">Recent</p>
                {swatches(recent)}
              </section>
            )}
            <section aria-label="Color palette">
              <p className="mb-2 text-xs text-muted-foreground">Palette</p>
              {swatches(highlight ? highlights : textPalette)}
            </section>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label="Custom color"
                value={HEX.test(custom) ? custom : "#000000"}
                onChange={(event) => setCustom(event.target.value)}
                className="size-8 cursor-pointer bg-transparent"
              />
              <input
                aria-label="HEX color"
                value={custom}
                maxLength={7}
                onChange={(event) => setCustom(event.target.value)}
                className="min-w-0 flex-1 rounded border bg-background px-2 text-sm"
              />
            </div>
            <div className="flex justify-between text-xs">
              <button
                type="button"
                className="cursor-pointer rounded px-2 py-1 hover:bg-accent"
                onClick={() => choose("")}
              >
                {highlight ? "Remove Highlight" : "Default color"}
              </button>
              <button
                type="button"
                disabled={!HEX.test(custom)}
                onClick={() => choose(custom)}
                className="cursor-pointer rounded bg-primary px-3 py-1 text-primary-foreground disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        );
      }}
    </ControlPopover>
  );
}

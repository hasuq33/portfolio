import { useEffect, useRef, useState, type RefObject } from "react";
import type { HtmlEngine } from "./engine";
import { BLOCKS } from "./formatting";

export function useEditorSelection(
  engine: RefObject<HtmlEngine | null>,
  enabled: boolean,
  owner: string,
) {
  const [view, setView] = useState<null | {
    rect: DOMRect;
    range: Range;
    state: ReturnType<HtmlEngine["state"]>;
    slash: { query: string; range: Range } | null;
    showToolbar: boolean;
  }>(null);
  const dismissed = useRef<string | null>(null);
  const signature = useRef("");
  useEffect(() => {
    const editor = engine.current;
    if (!editor || !enabled) {
      setView(null);
      return;
    }
    const inUI = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest(`[data-editor-ui="${owner}"]`);
    const refresh = () => {
      const selected = window.getSelection();
      const focusedUI = inUI(document.activeElement) || editor.selection.isHeld;
      if (
        !focusedUI &&
        (!selected?.rangeCount ||
          !editor.root.contains(selected.anchorNode) ||
          !editor.root.contains(selected.focusNode))
      ) {
        setView(null);
        return;
      }
      if (!focusedUI) editor.rememberSelection();
      const range = editor.range();
      const state = editor.state();
      let slash: { query: string; range: Range } | null = null;
      const block = editor.element()?.closest(`${BLOCKS},li,div`);
      if (
        range.collapsed &&
        block &&
        block !== editor.root &&
        !block.closest("pre") &&
        !block.querySelector("img,table")
      ) {
        const prefix = document.createRange();
        prefix.selectNodeContents(block);
        prefix.setEnd(range.startContainer, range.startOffset);
        const suffix = document.createRange();
        suffix.selectNodeContents(block);
        suffix.setStart(range.startContainer, range.startOffset);
        const match = prefix.toString().match(/^\/([a-z0-9 -]*)$/i);
        if (match && !suffix.toString().trim())
          slash = { query: match[1], range: prefix };
      }
      signature.current = `${range.startOffset}:${range.endOffset}:${editor.root.textContent}:${range.toString()}`;
      if (dismissed.current === signature.current) {
        setView(null);
        return;
      }
      setView({
        rect: range.getBoundingClientRect(),
        range,
        state,
        slash,
        showToolbar: !slash && (!range.collapsed || Boolean(state.link)),
      });
    };
    const outside = (event: PointerEvent) => {
      if (inUI(event.target)) return;
      if (event.target instanceof Node && editor.root.contains(event.target)) {
        dismissed.current = null;
        return;
      }
      dismissed.current = signature.current;
      setView(null);
    };
    document.addEventListener("selectionchange", refresh);
    document.addEventListener("pointerdown", outside);
    editor.root.addEventListener("editorchange", refresh);
    editor.root.addEventListener("input", refresh);
    editor.root.addEventListener("pointerup", refresh);
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      document.removeEventListener("pointerdown", outside);
      editor.root.removeEventListener("editorchange", refresh);
      editor.root.removeEventListener("input", refresh);
      editor.root.removeEventListener("pointerup", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    };
  }, [engine, enabled, owner]);
  return {
    view,
    dismiss: () => {
      dismissed.current = signature.current;
      setView(null);
    },
  };
}

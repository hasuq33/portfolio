import { EditorSelection } from "./selection";
import {
  BLOCKS,
  INLINE_STYLES,
  compactInline,
  elementAt,
  selectionState,
} from "./formatting";
import { TableCommands } from "./tables";
import { indentList, enterList } from "./lists";

type Point = {
  path: number[];
  offset: number;
};

type Bookmark = {
  start: Point;
  end: Point;
};

type Snapshot = {
  html: string;
  selection?: Bookmark;
};

const INLINE = /^(SPAN|STRONG|B|EM|I|U|S|A|CODE)$/;

export class HtmlEngine {
  private history: Snapshot[] = [];
  private position = -1;
  readonly selection: EditorSelection;
  readonly tables: TableCommands;
  private transactionDepth = 0;

  constructor(
    readonly root: HTMLElement,
    private readonly onChange: (html: string) => void,
  ) {
    this.selection = new EditorSelection(root);
    this.tables = new TableCommands(this);
  }

  private inside(node: Node | null): node is Node {
    return Boolean(node && (node === this.root || this.root.contains(node)));
  }

  rememberSelection() {
    this.selection.capture();
  }

  range() {
    return this.selection.range();
  }

  select(range: Range) {
    this.selection.select(range);
  }

  private point(node: Node, offset: number): Point {
    const path: number[] = [];
    let current = node;

    while (current !== this.root && current.parentNode) {
      const parent = current.parentNode;
      path.unshift(Array.from(parent.childNodes).indexOf(current as ChildNode));
      current = parent;
    }

    return { path, offset };
  }

  private bookmark(): Bookmark | undefined {
    const range = this.range();

    if (!this.inside(range.startContainer)) return;

    return {
      start: this.point(range.startContainer, range.startOffset),
      end: this.point(range.endContainer, range.endOffset),
    };
  }

  private resolve(point: Point) {
    let node: Node = this.root;

    for (const index of point.path) {
      node = node.childNodes[index] ?? node;
    }

    const maximum =
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent?.length ?? 0)
        : node.childNodes.length;

    return { node, offset: Math.min(point.offset, maximum) };
  }

  private restore(bookmark?: Bookmark) {
    const range = document.createRange();

    try {
      if (!bookmark) throw new Error("No bookmark");

      const start = this.resolve(bookmark.start);
      const end = this.resolve(bookmark.end);

      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
    } catch {
      range.selectNodeContents(this.root);
      range.collapse(false);
    }

    this.select(range);
  }

  private snapshot(): Snapshot {
    return {
      html: this.root.innerHTML,
      selection: this.bookmark(),
    };
  }

  setExternal(html: string) {
    this.root.innerHTML = html || "<p><br></p>";
    this.selection.reset();

    this.history = [{ html: this.root.innerHTML }];
    this.position = 0;
    this.changed();
  }

  changed() {
    this.root.dispatchEvent(new Event("editorchange"));
  }
  state() {
    return selectionState(this.root, this.range());
  }
  element() {
    return elementAt(this.range());
  }
  focus(node: Node, end = false) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(!end);
    this.select(range);
  }

  /** Preview updates do not emit data or history until pointer release. */
  preview() {
    this.beforeInput();
    const before = this.snapshot();
    let finished = false;
    return {
      commit: () => {
        if (!finished) {
          finished = true;
          this.commit();
          this.changed();
        }
      },
      cancel: () => {
        if (finished) return;
        finished = true;
        this.root.innerHTML = before.html;
        this.restore(before.selection);
        this.changed();
      },
    };
  }

  private emit() {
    const empty =
      !this.root.textContent?.trim() &&
      !this.root.querySelector('img,hr,table,[class*="editor-columns-"]');
    this.onChange(empty ? "" : this.root.innerHTML);
    this.changed();
  }

  /** Browsers can leave bare text or a BR at the root after Select All/Delete. */
  private normalizeRoot() {
    const range = this.range();
    const start = range.startContainer;
    const end = range.endContainer;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    let paragraph: HTMLParagraphElement | null = null;
    for (const node of Array.from(this.root.childNodes)) {
      const inline =
        node.nodeType === Node.TEXT_NODE ||
        (node instanceof HTMLElement &&
          (INLINE.test(node.tagName) || /^(BR|IMG)$/.test(node.tagName)));
      if (!inline) {
        paragraph = null;
        continue;
      }
      if (!paragraph) {
        paragraph = document.createElement("p");
        node.before(paragraph);
      }
      paragraph.append(node);
    }
    if (!this.root.firstChild) this.root.innerHTML = "<p><br></p>";
    if (
      start !== this.root &&
      end !== this.root &&
      this.inside(start) &&
      this.inside(end)
    ) {
      range.setStart(start, startOffset);
      range.setEnd(end, endOffset);
      this.select(range);
    }
  }

  beforeInput() {
    if (this.history[this.position]) {
      this.history[this.position].selection = this.bookmark();
    }
  }

  commit() {
    if (this.transactionDepth) return;
    this.normalizeRoot();
    const snapshot = this.snapshot();

    if (snapshot.html === this.history[this.position]?.html) return;

    this.history = this.history.slice(0, this.position + 1);
    this.history.push(snapshot);

    if (this.history.length > 60) this.history.shift();

    this.position = this.history.length - 1;
    this.emit();
  }

  transaction(change: () => void) {
    if (this.transactionDepth) {
      change();
      return;
    }
    this.beforeInput();
    const previous = this.snapshot();
    this.transactionDepth++;
    try {
      change();
    } catch (error) {
      this.root.innerHTML = previous.html;
      this.restore(previous.selection);
      throw error;
    } finally {
      this.transactionDepth--;
    }
    this.commit();
  }

  undo() {
    this.travel(-1);
  }

  redo() {
    this.travel(1);
  }

  private travel(direction: number) {
    const next = this.position + direction;
    const snapshot = this.history[next];

    if (!snapshot) return;

    this.position = next;
    this.root.innerHTML = snapshot.html;
    this.restore(snapshot.selection);
    this.emit();
  }

  insertText(text: string) {
    this.transaction(() => {
      const range = this.range();
      range.deleteContents();

      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStart(node, node.length);
      range.collapse(true);

      this.select(range);
    });
  }

  insertInline(node: Node) {
    this.transaction(() => {
      const range = this.range();
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);

      this.select(range);
    });
  }

  /**
   * Applies formatting to selected text nodes independently.
   * This avoids wrapping multiple paragraphs inside a single span.
   */
  mark(property: string, value: string) {
    const range = this.range();
    if (range.collapsed) return;

    this.transaction(() => {
      const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT);

      const selected: Array<{
        node: Text;
        start: number;
        end: number;
      }> = [];

      let current: Node | null;

      while ((current = walker.nextNode())) {
        const node = current as Text;

        if (!range.intersectsNode(node)) continue;

        const start = node === range.startContainer ? range.startOffset : 0;

        const end = node === range.endContainer ? range.endOffset : node.length;

        if (end > start) selected.push({ node, start, end });
      }

      const formatted: Text[] = [];

      for (const item of selected.reverse()) {
        if (item.end < item.node.length) item.node.splitText(item.end);

        const text =
          item.start > 0 ? item.node.splitText(item.start) : item.node;

        // Split inline ancestors so toggling underline off does not leave an
        // underline on a parent (CSS text-decoration cannot be canceled by a child).
        let current: Node = text;
        while (
          current.parentElement &&
          current.parentElement !== this.root &&
          INLINE.test(current.parentElement.tagName)
        ) {
          const parent = current.parentElement;
          const before = parent.cloneNode(false) as HTMLElement;
          const after = parent.cloneNode(false) as HTMLElement;
          while (parent.firstChild !== current)
            before.append(parent.firstChild!);
          while (current.nextSibling) after.append(current.nextSibling);
          const semantic =
            (property === "font-weight" &&
              /^(B|STRONG)$/.test(parent.tagName)) ||
            (property === "font-style" && /^(I|EM)$/.test(parent.tagName)) ||
            (property === "text-decoration" && /^(U|S)$/.test(parent.tagName));
          const focused = semantic
            ? document.createElement("span")
            : (parent.cloneNode(false) as HTMLElement);
          if (semantic) focused.style.cssText = parent.style.cssText;
          focused.style.removeProperty(property);
          if (property === "text-decoration")
            focused.style.removeProperty("text-decoration-line");
          focused.append(current);
          parent.replaceWith(
            ...(before.hasChildNodes() ? [before] : []),
            focused,
            ...(after.hasChildNodes() ? [after] : []),
          );
          current = focused;
        }

        if (value) {
          const span = document.createElement("span");
          span.style.setProperty(property, value);
          text.replaceWith(span);
          span.append(text);
        }

        formatted.unshift(text);
      }

      if (formatted.length) {
        compactInline(this.root);
        const next = document.createRange();

        next.setStart(formatted[0], 0);
        next.setEnd(
          formatted[formatted.length - 1],
          formatted[formatted.length - 1].length,
        );

        this.select(next);
      }
    });
  }

  toggle(
    property: string,
    enabled: string,
    disabled: string,
    isEnabled: (current: string) => boolean,
  ) {
    const range = this.range();

    const element =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;

    if (!element) return;

    if (property === "text-decoration") {
      const decorations = new Set<string>();
      let ancestor: Element | null = element;
      while (ancestor && ancestor !== this.root) {
        const style = getComputedStyle(ancestor).textDecoration;
        if (style.includes("underline") || ancestor.tagName === "U")
          decorations.add("underline");
        if (style.includes("line-through") || ancestor.tagName === "S")
          decorations.add("line-through");
        ancestor = ancestor.parentElement;
      }
      if (decorations.has(enabled)) decorations.delete(enabled);
      else decorations.add(enabled);
      this.mark(
        property,
        ["underline", "line-through"]
          .filter((mark) => decorations.has(mark))
          .join(" ") || "none",
      );
      return;
    }
    const current = getComputedStyle(element).getPropertyValue(property);
    this.mark(property, isEnabled(current) ? disabled : enabled);
  }

  currentBlock(): HTMLElement | null {
    this.normalizeRoot();
    const range = this.range();

    const element =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;

    const block = element?.closest<HTMLElement>(`${BLOCKS},li,td,th,div`);
    if (!block || block === this.root || !this.root.contains(block))
      return null;
    if (block.matches(BLOCKS)) return block;
    if (block.querySelector(`${BLOCKS},div,ul,ol,table`)) return null;
    // Keep list items, cells, and column containers structurally valid.
    const paragraph = document.createElement("p");
    paragraph.append(...Array.from(block.childNodes));
    block.append(paragraph);
    return paragraph;
  }

  block(tag: string) {
    if (
      !["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(
        tag,
      )
    )
      return;
    this.transaction(() => {
      const blocks = this.selectedBlocks();
      const replacements = blocks.map((current) => {
        const replacement = document.createElement(tag);
        replacement.style.cssText = current.style.cssText;
        replacement.append(...Array.from(current.childNodes));
        current.replaceWith(replacement);
        return replacement;
      });
      if (replacements.length) {
        const range = document.createRange();
        range.setStart(replacements[0], 0);
        range.setEnd(
          replacements.at(-1)!,
          replacements.at(-1)!.childNodes.length,
        );
        this.select(range);
      }
    });
  }

  selectedBlocks() {
    const range = this.range();
    if (range.collapsed) {
      const block = this.currentBlock();
      return block ? [block] : [];
    }
    const blocks = [...this.root.querySelectorAll<HTMLElement>(BLOCKS)].filter(
      (block) => range.intersectsNode(block) && !block.querySelector(BLOCKS),
    );
    return blocks.length
      ? blocks
      : [this.currentBlock()].filter((block): block is HTMLElement =>
          Boolean(block),
        );
  }

  align(value: "left" | "center" | "right" | "justify") {
    this.transaction(() => {
      for (const block of this.selectedBlocks()) block.style.textAlign = value;
    });
  }

  list(tag: "ul" | "ol") {
    this.transaction(() => {
      const range = this.range();

      const element =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement;

      const existing = element?.closest("ul,ol");

      if (existing && this.root.contains(existing)) {
        if (existing.tagName.toLowerCase() === tag) {
          indentList(this, -1);
          return;
        }
        const replacement = document.createElement(tag);
        replacement.append(...Array.from(existing.childNodes));
        existing.replaceWith(replacement);

        const next = document.createRange();
        next.selectNodeContents(replacement.lastElementChild!);
        next.collapse(false);
        this.select(next);
        return;
      }

      const blocks = this.selectedBlocks();
      let list: HTMLElement | null = null;
      let item: HTMLElement | null = null;
      for (const current of blocks) {
        if (current.closest("li")) continue;
        if (!list || list.nextElementSibling !== current) {
          list = document.createElement(tag);
          current.before(list);
        }
        item = document.createElement("li");
        item.append(...Array.from(current.childNodes));
        list.append(item);
        current.remove();
      }
      if (item) this.focus(item, true);
    });
  }

  /**
   * Inserts a structural block after the current top-level block.
   * It does not put tables/columns inside paragraphs.
   */
  insertBlock(node: HTMLElement) {
    this.transaction(() => {
      const range = this.range();
      let top: Node | null = range.startContainer;

      if (top === this.root) {
        top = this.root.childNodes[range.startOffset] ?? this.root.lastChild;
      }

      while (top?.parentNode && top.parentNode !== this.root) {
        top = top.parentNode;
      }

      const paragraph = document.createElement("p");
      paragraph.append(document.createElement("br"));

      if (top?.parentNode === this.root) {
        const empty =
          top instanceof HTMLElement &&
          top.matches("p,h1,h2,h3,h4,h5,h6") &&
          !top.textContent?.trim() &&
          !top.querySelector("img,hr,table");

        if (empty) {
          (top as HTMLElement).replaceWith(node, paragraph);
        } else {
          top.parentNode.insertBefore(node, top.nextSibling);
          node.after(paragraph);
        }
      } else {
        this.root.append(node, paragraph);
      }

      const next = document.createRange();
      next.setStart(paragraph, 0);
      next.collapse(true);

      this.select(next);
    });
  }

  link(rawUrl: string, options: { title?: string; newTab?: boolean } = {}) {
    const url = rawUrl.trim();
    if (!url) throw new Error("Enter a link URL.");
    const parsed = new URL(url, window.location.origin);

    if (
      url.startsWith("//") ||
      !["http:", "https:", "mailto:"].includes(parsed.protocol)
    ) {
      throw new Error("Use an http, https, mailto, or relative link.");
    }

    const range = this.range();

    const parent = (node: Node) =>
      node instanceof Element ? node : node.parentElement;

    const startLink = parent(range.startContainer)?.closest("a");
    const endLink = parent(range.endContainer)?.closest("a");
    const attributes = (anchor: HTMLAnchorElement) => {
      anchor.setAttribute("href", url);
      if (options.title?.trim())
        anchor.title = options.title.trim().slice(0, 300);
      else anchor.removeAttribute("title");
      if (options.newTab) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      } else {
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
      }
    };

    if (startLink && startLink === endLink) {
      this.transaction(() => attributes(startLink));
      return;
    }

    if (
      startLink ||
      endLink ||
      range.cloneContents().querySelector("a") ||
      parent(range.startContainer)?.closest(BLOCKS) !==
        parent(range.endContainer)?.closest(BLOCKS)
    ) {
      throw new Error(
        "Select text within one paragraph, without overlapping another link.",
      );
    }

    this.transaction(() => {
      const anchor = document.createElement("a");
      attributes(anchor);

      if (range.collapsed) {
        anchor.textContent = url;
      } else {
        anchor.append(range.extractContents());
      }

      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.collapse(true);

      this.select(range);
    });
  }

  unlink() {
    this.transaction(() => {
      const range = this.range();
      const anchors = [...this.root.querySelectorAll("a")].filter((a) =>
        range.intersectsNode(a),
      );
      for (const anchor of anchors) anchor.replaceWith(...anchor.childNodes);
      this.select(range);
    });
  }

  format(kind: "bold" | "italic" | "underline" | "strike") {
    const state = this.state();
    if (kind === "bold") this.mark("font-weight", state.bold ? "400" : "700");
    else if (kind === "italic")
      this.mark("font-style", state.italic ? "normal" : "italic");
    else
      this.toggle(
        "text-decoration",
        kind === "underline" ? "underline" : "line-through",
        "none",
        () => false,
      );
  }
  clearFormatting() {
    this.transaction(() => {
      for (const property of INLINE_STYLES) this.mark(property, "");
    });
  }
  fontSize(size: number) {
    if (!Number.isFinite(size) || size < 8 || size > 120)
      throw Error("Choose a font size between 8 and 120 pixels.");
    this.mark("font-size", `${Math.round(size)}px`);
  }
  indent(direction: 1 | -1) {
    this.transaction(() => {
      if (this.element()?.closest("li")) indentList(this, direction);
      else
        for (const block of this.selectedBlocks()) {
          const next = Math.max(
            0,
            Math.min(
              240,
              (parseInt(block.style.marginLeft) || 0) + direction * 24,
            ),
          );
          block.style.marginLeft = next ? `${next}px` : "";
        }
    });
  }
  enterList() {
    return enterList(this);
  }

  /** The caller must sanitize clipboard HTML before this command. */
  insertHtml(html: string) {
    if (!html) return;
    this.transaction(() => {
      const template = document.createElement("template");
      template.innerHTML = html;
      const fragment = template.content;
      const range = this.range();
      range.deleteContents();
      this.select(range);
      const block = this.currentBlock();
      if (
        fragment.children.length === 1 &&
        fragment.firstElementChild?.tagName === "P" &&
        block
      ) {
        fragment.firstElementChild.replaceWith(
          ...fragment.firstElementChild.childNodes,
        );
      }
      const structural = fragment.querySelector(
        `${BLOCKS},ul,ol,table,div,hr,figure`,
      );
      if (!structural) {
        const last = fragment.lastChild;
        range.insertNode(fragment);
        if (last) {
          range.setStartAfter(last);
          range.collapse(true);
          this.select(range);
        }
      } else if (block) {
        const tail = document.createRange();
        tail.selectNodeContents(block);
        const caret = this.range();
        tail.setStart(caret.startContainer, caret.startOffset);
        const after = document.createElement(block.tagName.toLowerCase());
        after.append(tail.extractContents());
        const last = fragment.lastChild;
        block.after(fragment, after);
        if (!block.textContent && !block.querySelector("img")) block.remove();
        if (last) this.focus(last, true);
      } else {
        const last = fragment.lastChild;
        range.insertNode(fragment);
        if (last) this.focus(last, true);
      }
    });
  }
}

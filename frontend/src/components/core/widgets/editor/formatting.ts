export const BLOCKS = "p,h1,h2,h3,h4,h5,h6,blockquote,pre";
export const FONT_FAMILIES = [
  "inherit",
  "Arial",
  "Georgia",
  "Verdana",
  "Tahoma",
  "monospace",
] as const;
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
export const INLINE_STYLES = [
  "color",
  "background-color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "text-decoration",
];

export function elementAt(range: Range): HTMLElement | null {
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement;
  if (node instanceof HTMLElement) {
    const child = node.childNodes[range.startOffset];
    return child instanceof HTMLElement ? child : node;
  }
  return null;
}

export function selectionState(root: HTMLElement, range: Range) {
  const element = elementAt(range) ?? root;
  const style = getComputedStyle(element);
  const block = element.closest<HTMLElement>(`${BLOCKS},li`);
  const nodes: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text: Node | null;
  while ((text = walker.nextNode())) {
    if (!range.intersectsNode(text)) continue;
    const start = text === range.startContainer ? range.startOffset : 0;
    const end =
      text === range.endContainer
        ? range.endOffset
        : (text.textContent?.length ?? 0);
    if (end > start && text.parentElement) nodes.push(text.parentElement);
  }
  const targets = range.collapsed || !nodes.length ? [element] : nodes;
  const decorated = (node: HTMLElement, kind: string) => {
    let parent: HTMLElement | null = node;
    while (parent && parent !== root) {
      if (
        getComputedStyle(parent).textDecoration.includes(kind) ||
        (kind === "underline" && parent.tagName === "U") ||
        (kind === "line-through" && parent.tagName === "S")
      )
        return true;
      parent = parent.parentElement;
    }
    return false;
  };
  return {
    bold: targets.every(
      (node) =>
        Number(getComputedStyle(node).fontWeight) >= 600 ||
        /bold/.test(getComputedStyle(node).fontWeight) ||
        Boolean(node.closest("b,strong")),
    ),
    italic: targets.every(
      (node) =>
        getComputedStyle(node).fontStyle === "italic" ||
        Boolean(node.closest("i,em")),
    ),
    underline: targets.every((node) => decorated(node, "underline")),
    strike: targets.every((node) => decorated(node, "line-through")),
    tag: block?.tagName.toLowerCase() ?? "p",
    alignment: (() => {
      const blockStyle = block ? getComputedStyle(block) : style;
      const alignment = blockStyle.textAlign;
      if (!alignment || alignment === "start")
        return blockStyle.direction === "rtl" ? "right" : "left";
      if (alignment === "end")
        return blockStyle.direction === "rtl" ? "left" : "right";
      return alignment;
    })(),
    color: style.color || "#171717",
    highlight: style.backgroundColor,
    fontSize: parseFloat(style.fontSize) || 16,
    fontFamily: style.fontFamily.replace(/["']/g, ""),
    list: element.closest("ul,ol")?.tagName.toLowerCase() ?? "",
    link: element.closest<HTMLAnchorElement>("a"),
    table: element.closest<HTMLTableElement>("table"),
  };
}
export type FormattingState = ReturnType<typeof selectionState>;

/** Flatten only equivalent inline wrappers; never touch paragraphs, links or tables. */
export function compactInline(root: HTMLElement) {
  for (const span of [
    ...root.querySelectorAll<HTMLSpanElement>("span"),
  ].reverse()) {
    if (!span.getAttribute("style")?.trim()) span.removeAttribute("style");
    if (!span.attributes.length) {
      span.replaceWith(...span.childNodes);
      continue;
    }
    const child = span.firstChild;
    if (
      span.childNodes.length === 1 &&
      child instanceof HTMLElement &&
      child.tagName === "SPAN" &&
      !span.className &&
      !child.className
    ) {
      const style = span.style.cssText;
      const inner = child.style.cssText;
      span.style.cssText = style;
      const probe = document.createElement("span");
      probe.style.cssText = inner;
      for (const name of Array.from(probe.style))
        span.style.setProperty(name, probe.style.getPropertyValue(name));
      child.replaceWith(...child.childNodes);
    }
  }
}

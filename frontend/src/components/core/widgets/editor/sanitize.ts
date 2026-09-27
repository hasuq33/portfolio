import DOMPurify from "dompurify";

const color =
  /^(?:#[\da-f]{3}(?:[\da-f]{3})?|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;
const styles: Record<string, RegExp> = {
  color,
  "background-color": color,
  "font-weight": /^(normal|bold|400|500|600|700)$/,
  "font-style": /^(normal|italic)$/,
  "text-decoration": /^(none|underline|line-through|underline line-through)$/,
  "text-align": /^(left|center|right|justify)$/,
  "font-family": /^(Arial|Georgia|Verdana|Tahoma|monospace)$/i,
  "font-size": /^(?:[89]|[1-9]\d|1[01]\d|120)px$/,
  "margin-left": /^(?:0|[1-9]\d?|1\d\d|2[0-3]\d|240)px$/,
};

/** Keep the editable preview's allowlist in step with backend/blogs/blog-html.ts. */
export function sanitizeEditorHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "span",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "hr",
      "table",
      "colgroup",
      "col",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "img",
      "div",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "scope",
      "title",
      "src",
      "alt",
      "width",
      "height",
      "style",
      "class",
      "colspan",
      "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
  for (const element of template.content.querySelectorAll<HTMLElement>("*")) {
    const safeStyles: Array<[string, string]> = [];
    for (const property of Array.from(element.style)) {
      const value = element.style.getPropertyValue(property).trim();
      const size =
        element.tagName === "COL" &&
        property === "width" &&
        /^(?:\d{1,2}(?:\.\d{1,3})?|100)%$/.test(value);
      const height =
        element.tagName === "TR" &&
        property === "height" &&
        /^(?:2[89]|[3-9]\d|[1-9]\d{2}|1000)px$/.test(value);
      if (styles[property]?.test(value) || size || height)
        safeStyles.push([property, value]);
    }
    element.removeAttribute("style");
    for (const [property, value] of safeStyles)
      element.style.setProperty(property, value);
    const classes = [...element.classList].filter((name) =>
      /^editor-(icon|columns-[234]|banner-(info|success|warning|danger))$/.test(
        name,
      ),
    );
    element.removeAttribute("class");
    if (classes.length) element.className = classes.join(" ");
    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      try {
        if (
          href.startsWith("//") ||
          !["http:", "https:", "mailto:"].includes(
            new URL(href, window.location.origin).protocol,
          )
        )
          element.removeAttribute("href");
      } catch {
        element.removeAttribute("href");
      }
      if (element.getAttribute("target") === "_blank")
        element.setAttribute("rel", "noopener noreferrer");
      else {
        element.removeAttribute("target");
        element.removeAttribute("rel");
      }
    }
    if (element instanceof HTMLImageElement) {
      const src = element.getAttribute("src") ?? "";
      if (
        !/^\/editor-media\/[a-f\d]{24}$/.test(src) &&
        !/^\/editor-icons\/(star|heart|check|info|code|globe)$/.test(src) &&
        !/^https?:\/\//i.test(src) &&
        !/^\/blog-images\/[a-f\d]{24}\/(cover|og-image)(?:\?[^\s]*)?$/.test(src)
      )
        element.remove();
    }
  }
  return template.innerHTML;
}

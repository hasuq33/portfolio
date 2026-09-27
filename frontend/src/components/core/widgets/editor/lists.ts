import type { HtmlEngine } from "./engine";

export function indentList(editor: HtmlEngine, direction: 1 | -1) {
  const item = editor.element()?.closest<HTMLLIElement>("li");
  const list = item?.parentElement;
  if (!item || !list || !editor.root.contains(list)) return;
  if (direction === 1) {
    const previous = item.previousElementSibling;
    if (!previous) return;
    let nested = [...previous.children].find(
      (child) => child.tagName === list.tagName,
    );
    if (!nested) {
      nested = document.createElement(list.tagName.toLowerCase());
      previous.append(nested);
    }
    nested.append(item);
    editor.focus(item, true);
    return;
  }
  const parentItem = list.parentElement?.closest("li");
  if (parentItem && parentItem.parentElement?.matches("ul,ol")) {
    parentItem.after(item);
    if (!list.children.length) list.remove();
    editor.focus(item, true);
    return;
  }
  // Split the outer list around the item; keep following items in a list.
  const after = list.cloneNode(false) as HTMLElement;
  while (item.nextElementSibling) after.append(item.nextElementSibling);
  const paragraph = document.createElement("p");
  const nested: Element[] = [];
  for (const child of [...item.childNodes]) {
    if (child instanceof Element && child.matches("ul,ol")) nested.push(child);
    else if (child instanceof Element && child.matches("p,h1,h2,h3,h4,h5,h6"))
      paragraph.append(...child.childNodes);
    else paragraph.append(child);
  }
  if (!paragraph.hasChildNodes())
    paragraph.append(document.createElement("br"));
  list.after(paragraph, ...nested, ...(after.children.length ? [after] : []));
  item.remove();
  if (!list.children.length) list.remove();
  editor.focus(paragraph);
}

export function enterList(editor: HtmlEngine) {
  const item = editor.element()?.closest<HTMLLIElement>("li");
  if (!item || !editor.root.contains(item)) return false;
  editor.transaction(() => {
    if (!item.textContent?.trim() && !item.querySelector("img,table")) {
      indentList(editor, -1);
      return;
    }
    const range = editor.range();
    range.deleteContents();
    const tail = document.createRange();
    tail.selectNodeContents(item);
    tail.setStart(range.startContainer, range.startOffset);
    const next = document.createElement("li");
    next.append(tail.extractContents());
    if (!next.textContent && !next.querySelector("img,ul,ol"))
      next.innerHTML = "<p><br></p>";
    item.after(next);
    editor.focus(next.firstChild ?? next);
  });
  return true;
}

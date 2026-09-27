const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { JSDOM } = require("jsdom");

require.extensions[".ts"] = (mod, filename) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
const file = path.resolve(
  __dirname,
  "../src/components/core/widgets/editor/engine.ts",
);
const compiled = new Module(file, module);
compiled.filename = file;
compiled.paths = module.paths;
compiled._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
const { HtmlEngine } = compiled.exports;

let dom, root, engine, changes;
beforeEach(() => {
  dom?.window.close();
  dom = new JSDOM(
    '<div id="editor" contenteditable="true" tabindex="0"></div>',
    { url: "http://localhost/" },
  );
  for (const name of [
    "window",
    "document",
    "Node",
    "NodeFilter",
    "Element",
    "HTMLElement",
    "Text",
    "Event",
  ]) {
    global[name] = name === "window" ? dom.window : dom.window[name];
  }
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  root = document.getElementById("editor");
  changes = [];
  engine = new HtmlEngine(root, (html) => changes.push(html));
  engine.setExternal("<p>Hello world</p>");
});

function select(node, start, end = start, last = node) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(last, end);
  engine.select(range);
}

test("font changes reuse a single wrapper and undo/redo restores styles", () => {
  select(root.firstChild.firstChild, 0, 5);
  engine.fontSize(24);
  engine.mark("font-family", "Georgia");
  for (const color of ["#112233", "#334455", "#556677"])
    engine.mark("color", color);
  assert.equal(root.querySelectorAll("span span").length, 0);
  assert.equal(root.querySelectorAll("span").length, 1);
  assert.equal(engine.state().fontSize, 24);
  assert.equal(engine.state().fontFamily, "Georgia");
  engine.undo();
  assert.equal(root.querySelector("span").style.color, "rgb(51, 68, 85)");
  engine.redo();
  assert.equal(root.querySelector("span").style.color, "rgb(85, 102, 119)");
});

test("mixed formatting is not incorrectly reported as uniformly bold", () => {
  engine.setExternal("<p><strong>Bold</strong> plain</p>");
  const range = document.createRange();
  range.selectNodeContents(root.firstChild);
  engine.select(range);
  assert.equal(engine.state().bold, false);
});

test("list creation includes every selected paragraph", () => {
  engine.setExternal("<p>One</p><p>Two</p><p>Three</p>");
  select(root.firstChild.firstChild, 0, 3, root.children[1].firstChild);
  engine.list("ul");
  assert.deepEqual(
    [...root.querySelectorAll("li")].map((li) => li.textContent),
    ["One", "Two"],
  );
  assert.equal(root.lastElementChild.textContent, "Three");
});

test("clear formatting preserves links, paragraphs and text in one undo step", () => {
  engine.setExternal(
    '<h2><a href="/blog"><strong><em><u><span style="color:red;font-size:24px">Hello</span></u></em></strong></a></h2>',
  );
  select(root.querySelector("span").firstChild, 0, 5);
  const before = root.innerHTML;
  engine.clearFormatting();
  assert.equal(root.textContent, "Hello");
  assert.ok(root.querySelector('h2 a[href="/blog"]'));
  assert.equal(root.querySelector("strong,em,u,span"), null);
  engine.undo();
  assert.equal(root.innerHTML, before);
});

test("semantic styles and alignment apply across selected paragraphs", () => {
  engine.setExternal("<p>One</p><p>Two</p>");
  select(root.firstChild.firstChild, 0, 3, root.lastChild.firstChild);
  engine.block("h1");
  assert.equal(root.querySelectorAll("h1").length, 2);
  engine.align("justify");
  assert.ok(
    [...root.children].every((node) => node.style.textAlign === "justify"),
  );
  engine.undo();
  assert.ok([...root.children].every((node) => !node.style.textAlign));
});

test("link edit detects the caret, keeps safe new-tab attributes and supports removal", () => {
  select(root.firstChild.firstChild, 0, 5);
  engine.link("https://example.com", { title: "Example", newTab: true });
  const anchor = root.querySelector("a");
  assert.equal(anchor.rel, "noopener noreferrer");
  select(anchor.firstChild, 2);
  assert.equal(engine.state().link, anchor);
  engine.link("/blog", { title: "Blog" });
  assert.equal(anchor.getAttribute("target"), null);
  assert.equal(anchor.title, "Blog");
  engine.unlink();
  assert.equal(root.querySelector("a"), null);
  assert.equal(root.textContent, "Hello world");
  engine.undo();
  assert.equal(root.querySelector("a").getAttribute("href"), "/blog");
});

test("held selection survives focus moving outside the editor", () => {
  select(root.firstChild.firstChild, 0, 5);
  engine.selection.hold();
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  window.getSelection().removeAllRanges();
  engine.rememberSelection();
  engine.select(engine.range());
  engine.fontSize(22);
  engine.selection.release();
  assert.equal(root.querySelector("span").textContent, "Hello");
});

test("Enter splits list items and an empty item exits the list", () => {
  engine.setExternal("<ul><li>Hello</li></ul>");
  select(root.querySelector("li").firstChild, 2);
  assert.equal(engine.enterList(), true);
  assert.deepEqual(
    [...root.querySelectorAll("li")].map((li) => li.textContent),
    ["He", "llo"],
  );
  engine.focus(root.querySelectorAll("li")[1], true);
  engine.enterList();
  engine.enterList();
  assert.equal(root.querySelectorAll("li").length, 2);
  assert.equal(root.lastElementChild.tagName, "P");
});

test("nested list indentation can be reversed", () => {
  engine.setExternal("<ul><li>One</li><li>Two</li></ul>");
  select(root.querySelectorAll("li")[1].firstChild, 1);
  engine.indent(1);
  assert.equal(root.querySelector("li ul li").textContent, "Two");
  engine.indent(-1);
  assert.equal(root.querySelector("li ul"), null);
  assert.deepEqual(
    [...root.querySelectorAll("li")].map((li) => li.textContent),
    ["One", "Two"],
  );
});

test("table actions and Tab navigation keep semantic editable cells", () => {
  engine.tables.insert();
  let table = root.querySelector("table");
  assert.equal(table.rows.length, 2);
  assert.equal(table.querySelectorAll("td").length, 4);
  engine.tables.action("column-right");
  assert.equal(table.rows[0].cells.length, 3);
  engine.tables.action("row-below");
  assert.equal(table.rows.length, 3);
  engine.tables.action("header-row");
  assert.equal(table.rows[0].querySelectorAll("th").length, 3);
  engine.tables.action("header-column");
  assert.ok([...table.rows].every((row) => row.cells[0].tagName === "TH"));
  engine.focus(table.rows[2].cells[2].firstChild);
  engine.tables.tab(false);
  assert.equal(table.rows.length, 4);
  assert.equal(engine.tables.current().cell, table.rows[3].cells[0]);
  engine.tables.tab(true);
  assert.equal(engine.tables.current().cell, table.rows[2].cells[2]);
  engine.tables.action("delete-column");
  assert.equal(table.rows[0].cells.length, 2);
  engine.tables.action("delete-row");
  assert.equal(table.rows.length, 3);
  engine.tables.action("delete-table");
  assert.equal(root.querySelector("table"), null);
  engine.undo();
  assert.ok(root.querySelector("table"));
});

test("column drag has bounded dimensions and exactly one history entry", () => {
  engine.tables.insert();
  const table = root.querySelector("table");
  const before = root.innerHTML;
  const count = changes.length;
  const resize = engine.tables.resize(table, "column", 0);
  resize.move(10);
  resize.move(20);
  resize.move(60);
  assert.equal(changes.length, count);
  resize.commit();
  assert.equal(changes.length, count + 1);
  assert.equal(table.querySelector("col").style.width, "60%");
  const after = root.innerHTML;
  engine.undo();
  assert.equal(root.innerHTML, before);
  engine.redo();
  assert.equal(root.innerHTML, after);
});

test("row drag cancel is clean and row height has a minimum", () => {
  engine.tables.insert();
  let table = root.querySelector("table");
  const before = root.innerHTML;
  const resize = engine.tables.resize(table, "row", 0);
  resize.move(-999);
  assert.equal(table.rows[0].style.height, "28px");
  resize.cancel();
  assert.equal(root.innerHTML, before);
  table = root.querySelector("table");
  const second = engine.tables.resize(table, "row", 0);
  second.move(40);
  second.commit();
  assert.equal(table.rows[0].style.height, "76px");
  engine.undo();
  assert.equal(root.innerHTML, before);
});

test("rich paste preserves surrounding text and does not nest paragraphs", () => {
  select(root.firstChild.firstChild, 5);
  engine.insertHtml("<h2>Title</h2><ul><li>Item</li></ul>");
  assert.equal(root.textContent, "HelloTitleItem world");
  assert.equal(root.querySelector("p h2,p ul"), null);
  engine.undo();
  assert.equal(root.innerHTML, "<p>Hello world</p>");
  select(root.firstChild.firstChild, 5);
  engine.insertHtml("<p><strong> bold</strong></p>");
  assert.equal(root.innerHTML, "<p>Hello<strong> bold</strong> world</p>");
});

test("formats only selected text and maintains selection", () => {
  select(root.firstChild.firstChild, 0, 5);
  engine.mark("font-weight", "700");
  assert.equal(root.querySelector("span").textContent, "Hello");
  assert.equal(root.textContent, "Hello world");
  assert.equal(window.getSelection().toString(), "Hello");
});

test("formats a selection across paragraphs without nesting blocks in spans", () => {
  engine.setExternal("<p>First</p><p>Second</p>");
  select(root.firstChild.firstChild, 2, 3, root.lastChild.firstChild);
  engine.mark("color", "#2563eb");
  assert.equal(root.querySelectorAll("p").length, 2);
  assert.equal(root.querySelector("span p"), null);
  assert.deepEqual(
    [...root.querySelectorAll("span")].map((node) => node.textContent),
    ["rst", "Sec"],
  );
});

test("removes underline on a partial selection without clearing neighboring text", () => {
  engine.setExternal("<p><u><strong>Hello world</strong></u></p>");
  select(root.querySelector("strong").firstChild, 0, 5);
  engine.toggle("text-decoration", "underline", "none", (value) =>
    value.includes("underline"),
  );
  const selected = window.getSelection().getRangeAt(0).startContainer;
  assert.equal(selected.textContent, "Hello");
  assert.equal(selected.parentElement.closest("u"), null);
  assert.equal(selected.parentElement.closest("strong")?.textContent, "Hello");
  assert.equal(root.querySelector("u").textContent, " world");
});

test("undo/redo and external discard reset history", () => {
  select(root.firstChild.firstChild, 5);
  engine.insertText("!");
  assert.equal(root.textContent, "Hello! world");
  engine.undo();
  assert.equal(root.textContent, "Hello world");
  engine.redo();
  assert.equal(root.textContent, "Hello! world");
  engine.setExternal("<p>Saved</p>");
  engine.undo();
  assert.equal(root.textContent, "Saved");
});

test("nested slash command mutations are one undo step", () => {
  engine.setExternal("<p>/heading</p>");
  select(root.firstChild.firstChild, 0, 8);
  engine.transaction(() => {
    engine.insertText("");
    engine.block("h2");
  });
  assert.equal(root.firstChild.tagName, "H2");
  assert.equal(changes.length, 1);
  engine.undo();
  assert.equal(root.innerHTML, "<p>/heading</p>");
});

test("commands work after browsers leave a bare text root", () => {
  root.textContent = "/heading";
  select(root.firstChild, 0, 8);
  engine.insertText("");
  engine.block("h2");
  assert.equal(root.firstChild.tagName, "H2");
});

test("structural insertion does not delete empty columns", () => {
  engine.setExternal(
    '<div class="editor-columns-2"><div><p><br></p></div><div><p><br></p></div></div>',
  );
  select(root.querySelector("p"), 0);
  engine.insertBlock(document.createElement("hr"));
  assert.ok(root.querySelector(".editor-columns-2"));
  assert.equal(root.children[1].tagName, "HR");
});

test("heading in a list keeps the list item intact", () => {
  engine.setExternal("<ul><li>Hello</li></ul>");
  select(root.querySelector("li").firstChild, 2);
  engine.block("h3");
  assert.equal(root.querySelector("ul > li > h3").textContent, "Hello");
});

test("paste is literal text and unsafe links are rejected", () => {
  select(root.firstChild.firstChild, 0, 11);
  engine.insertText("<img src=x onerror=alert(1)>");
  assert.equal(root.querySelector("img"), null);
  assert.throws(() => engine.link("javascript:alert(1)"));
  assert.throws(() => engine.link(""));
});

test("failed transactions roll back HTML without notifying the form", () => {
  assert.throws(() =>
    engine.transaction(() => {
      root.innerHTML = "<p>Bad</p>";
      throw Error("stop");
    }),
  );
  assert.equal(root.innerHTML, "<p>Hello world</p>");
  assert.equal(changes.length, 0);
});

test("undoing back to an empty document does not leave a false dirty value", () => {
  engine.setExternal("");
  select(root.firstChild, 0);
  engine.insertText("Hello");
  engine.undo();
  assert.equal(changes.at(-1), "");
});

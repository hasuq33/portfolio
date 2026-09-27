const { test, afterEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Node",
  "NodeFilter",
  "Element",
  "HTMLElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "DocumentFragment",
  "MutationObserver",
  "CustomEvent",
  "Event",
  "FormData",
  "HTMLButtonElement",
  "localStorage",
]) {
  global[name] = name === "window" ? dom.window : dom.window[name];
}
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.Range.prototype.getBoundingClientRect = () => ({
  left: 20,
  bottom: 30,
});
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

// Test-only TS/TSX loader: no emitted application files or bundler required.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith("@/"))
    request = path.resolve(__dirname, "../src", request.slice(2));
  return originalResolve.call(this, request, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (loaded, filename) =>
    loaded._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
}
require.extensions[".css"] = () => {};

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const { HtmlWidget } = require("../src/components/core/widgets/html.tsx");
const {
  sanitizeEditorHtml,
} = require("../src/components/core/widgets/editor/sanitize.ts");
let app, container;
const field = { name: "contentHtml", label: "Content", widget: "html" };

async function render(props = {}) {
  if (!app) {
    container = document.createElement("div");
    document.body.append(container);
    app = createRoot(container);
  }
  await act(async () =>
    app.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(HtmlWidget, {
          field,
          value: "<p>Hello</p>",
          ...props,
        }),
      ),
    ),
  );
  return document.getElementById("contentHtml");
}

async function select(node, start, end = start) {
  await act(async () => {
    document.getElementById("contentHtml").focus();
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
}

async function key(element, key, options = {}) {
  await act(async () =>
    element.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      }),
    ),
  );
}

afterEach(async () => {
  if (app) await act(async () => app.unmount());
  app = null;
  document.body.innerHTML = "";
});
after(() => dom.window.close());

test("StrictMode retains initial history and native undo works", async () => {
  const editor = await render();
  await select(editor.firstChild.firstChild, 5);
  await act(async () => {
    editor.dispatchEvent(
      new dom.window.InputEvent("beforeinput", {
        inputType: "insertText",
        bubbles: true,
      }),
    );
    editor.firstChild.firstChild.textContent = "Hello!";
    editor.dispatchEvent(
      new dom.window.InputEvent("input", {
        inputType: "insertText",
        bubbles: true,
      }),
    );
    editor.dispatchEvent(
      new dom.window.InputEvent("beforeinput", {
        inputType: "historyUndo",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  assert.equal(editor.textContent, "Hello");
});

test("slash menu supports filtering, arrows, Enter and atomic undo", async () => {
  const editor = await render({ value: "<p>/heading</p>" });
  await select(editor.firstChild.firstChild, 8);
  assert.equal(document.querySelectorAll('[role="option"]').length, 6);
  await key(editor, "ArrowDown");
  await key(editor, "Enter");
  assert.equal(editor.firstChild.tagName, "H2");
  assert.equal(editor.textContent, "");
  await key(editor, "z", { ctrlKey: true });
  assert.equal(editor.textContent, "/heading");
});

test("Escape dismisses slash menu without reopening on scroll", async () => {
  const editor = await render({ value: "<p>/</p>" });
  await select(editor.firstChild.firstChild, 1);
  assert.ok(document.querySelector('[role="listbox"]'));
  await key(editor, "Escape");
  await act(async () => window.dispatchEvent(new Event("scroll")));
  assert.equal(document.querySelector('[role="listbox"]'), null);
});

test("slash commands do not open in the middle of existing text", async () => {
  const editor = await render({ value: "<p>Existing /table</p>" });
  await select(editor.firstChild.firstChild, 15);
  assert.equal(document.querySelector('[role="listbox"]'), null);
});

test("floating formatting preserves selected text and reports active state", async () => {
  const editor = await render();
  await select(editor.firstChild.firstChild, 0, 5);
  const bold = document.querySelector('button[aria-label="Bold (Ctrl/Cmd+B)"]');
  assert.ok(bold);
  await act(async () => bold.click());
  assert.equal(window.getSelection().toString(), "Hello");
  assert.equal(
    document
      .querySelector('button[aria-label="Bold (Ctrl/Cmd+B)"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  await key(editor, "z", { ctrlKey: true });
  assert.equal(editor.innerHTML, "<p>Hello</p>");
});

test("color popover preserves selection when a swatch is clicked", async () => {
  const editor = await render();
  await select(editor.firstChild.firstChild, 0, 5);
  await act(async () =>
    document.querySelector('button[aria-label="Text color"]').click(),
  );
  const swatch = document.querySelector('button[aria-label="Text #2563eb"]');
  assert.ok(swatch);
  await act(async () => swatch.click());
  assert.equal(editor.querySelector("span").style.color, "rgb(37, 99, 235)");
  assert.equal(window.getSelection().toString(), "Hello");
});

test("outside dismissal releases popup selection before selecting other text", async () => {
  const editor = await render({ value: "<p>Hello world</p>" });
  await select(editor.firstChild.firstChild, 0, 5);
  await act(async () =>
    document.querySelector('button[aria-label="Text color"]').click(),
  );
  await act(async () =>
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })),
  );
  await select(editor.firstChild.firstChild, 6, 11);
  await key(editor, "b", { ctrlKey: true });
  assert.equal(editor.querySelector("span").textContent, "world");
});

test("recent text and highlight colors persist separately with bounded history", () => {
  const {
    readRecentColors,
    rememberColor,
    TEXT_COLORS_KEY,
    HIGHLIGHT_COLORS_KEY,
  } = require("../src/components/core/widgets/editor/ColorPicker.tsx");
  localStorage.clear();
  for (let i = 0; i < 12; i++)
    rememberColor(TEXT_COLORS_KEY, "#" + i.toString(16).padStart(6, "0"));
  rememberColor(HIGHLIGHT_COLORS_KEY, "#FFFF00");
  assert.equal(readRecentColors(TEXT_COLORS_KEY).length, 10);
  assert.deepEqual(readRecentColors(HIGHLIGHT_COLORS_KEY), ["#ffff00"]);
  rememberColor(TEXT_COLORS_KEY, "#00000b");
  assert.equal(readRecentColors(TEXT_COLORS_KEY).length, 10);
  localStorage.setItem(TEXT_COLORS_KEY, "not json");
  assert.deepEqual(readRecentColors(TEXT_COLORS_KEY), []);
});

test("rich clipboard sanitization preserves semantics and rejects executable markup", async () => {
  const editor = await render();
  await select(editor.firstChild.firstChild, 5);
  await act(async () => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: {
        getData: (type) =>
          type === "text/html"
            ? '<h1 onclick="evil()">Title</h1><p style="font-size:24px;position:fixed"><strong>Bold</strong><script>evil()</script></p>'
            : "",
      },
    });
    editor.dispatchEvent(event);
  });
  assert.ok(editor.querySelector("h1"));
  assert.ok(editor.querySelector("strong"));
  assert.ok(editor.innerHTML.includes("font-size: 24px"));
  assert.doesNotMatch(editor.innerHTML, /onclick|evil|position|script/);
  await key(editor, "z", { ctrlKey: true });
  assert.equal(editor.innerHTML, "<p>Hello</p>");
});

test("slash table inserts a default 2 by 2 table with contextual controls", async () => {
  const editor = await render({ value: "<p>/table</p>" });
  await select(editor.firstChild.firstChild, 6);
  await key(editor, "Enter");
  assert.equal(editor.querySelectorAll("td").length, 4);
  assert.ok(document.querySelector('[aria-label="Table controls"]'));
  await key(editor, "z", { ctrlKey: true });
  assert.equal(editor.textContent, "/table");
});

test("readonly does not show authoring controls", async () => {
  const editor = await render({ readonly: true });
  assert.equal(editor.getAttribute("contenteditable"), "false");
  assert.equal(document.querySelector('button[aria-label="Undo"]'), null);
  await key(editor, "b", { ctrlKey: true });
  assert.equal(editor.innerHTML, "<p>Hello</p>");
});

test("external reset invalidates redo even if the HTML value is unchanged", async () => {
  const editor = await render();
  await select(editor.firstChild.firstChild, 0, 5);
  await key(editor, "b", { ctrlKey: true });
  await key(editor, "z", { ctrlKey: true });
  await render({ resetKey: 1 });
  await key(editor, "z", { ctrlKey: true, shiftKey: true });
  assert.equal(editor.innerHTML, "<p>Hello</p>");
});

test("upload reports busy state and a late response cannot overwrite Discard", async () => {
  let complete;
  global.fetch = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  const states = [];
  const onBusyChange = (busy) => states.push(busy);
  const editor = await render({ onBusyChange });
  await select(editor.firstChild.firstChild, 5);
  const input = document.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [new dom.window.File(["png"], "test.png", { type: "image/png" })],
  });
  await act(async () =>
    input.dispatchEvent(new Event("change", { bubbles: true })),
  );
  assert.equal(states.at(-1), true);
  assert.equal(editor.getAttribute("contenteditable"), "false");
  await render({ onBusyChange, resetKey: 1 });
  await act(async () =>
    complete(
      new Response(
        JSON.stringify({
          id: "507f1f77bcf86cd799439011",
          url: "/editor-media/507f1f77bcf86cd799439011",
        }),
        { status: 201 },
      ),
    ),
  );
  assert.equal(editor.querySelector("img"), null);
  assert.equal(states.at(-1), false);
});

test("client sanitizer bounds CSS and image sources before insertion", () => {
  const html = sanitizeEditorHtml(
    '<p class="fixed editor-banner-info" style="position:fixed;color:#2563eb">Safe</p><img src="data:image/png;base64,AAAA"><script>evil()</script>',
  );
  assert.ok(html.includes("editor-banner-info"));
  assert.ok(html.includes("color:"));
  assert.ok(!html.includes("position"));
  assert.ok(!html.includes("fixed"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script"));
});

test("icon endpoint paths match the approved React Icons registry", () => {
  const { editorIcons } = require("../src/lib/editor-icons.ts");
  const { editorIconData } = require("../src/lib/editor-icon-data.ts");
  const { renderToStaticMarkup } = require("react-dom/server");
  assert.deepEqual(Object.keys(editorIcons), Object.keys(editorIconData));
  for (const [name, Icon] of Object.entries(editorIcons)) {
    const svg = renderToStaticMarkup(React.createElement(Icon));
    assert.ok(svg.includes(`d="${editorIconData[name][1]}"`), name);
  }
});

test("generic Form View blocks Save while uploading and Escape does not discard editor text", async () => {
  const originalLoad = Module._load;
  Module._load = function (request, ...args) {
    if (request === "@/components/core/widgets/WidgetRenderer") {
      return {
        __esModule: true,
        default: (props) => React.createElement(HtmlWidget, props),
      };
    }
    return originalLoad.call(this, request, ...args);
  };
  const {
    FormView,
  } = require("../src/components/core/views/shared/FormView.tsx");
  Module._load = originalLoad;
  let complete,
    saves = 0,
    discards = 0;
  global.fetch = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  window.confirm = () => {
    throw new Error("Editor Escape must not prompt to discard");
  };
  await render();
  await act(async () =>
    app.render(
      React.createElement(FormView, {
        title: "Test article",
        data: { contentHtml: "<p>Hello</p>" },
        dirty: true,
        sections: [{ id: "body", fields: [field] }],
        onSave: () => {
          saves++;
        },
        onDiscard: () => {
          discards++;
        },
        onClose: () => {},
      }),
    ),
  );
  const editor = document.getElementById("contentHtml");
  await select(editor.firstChild.firstChild, 5);
  await key(editor, "Escape");
  assert.equal(discards, 0);
  const input = document.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [new dom.window.File(["png"], "test.png", { type: "image/png" })],
  });
  await act(async () =>
    input.dispatchEvent(new Event("change", { bubbles: true })),
  );
  assert.equal(document.querySelector('button[type="submit"]').disabled, true);
  await key(editor, "s", { ctrlKey: true });
  assert.equal(saves, 0);
  await act(async () =>
    complete(
      new Response(
        JSON.stringify({ url: "/editor-media/507f1f77bcf86cd799439011" }),
        { status: 201 },
      ),
    ),
  );
  assert.ok(editor.querySelector("img"));
  assert.equal(document.querySelector('button[type="submit"]').disabled, false);
  await key(editor, "s", { ctrlKey: true });
  assert.equal(saves, 1);
});

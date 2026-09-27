const { test, afterEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "document",
  "Node",
  "NodeFilter",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "MutationObserver",
  "CustomEvent",
  "Event",
  "DocumentFragment",
])
  global[key] = key === "window" ? dom.window : dom.window[key];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.HTMLFormElement = dom.window.HTMLFormElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.requestAnimationFrame = (callback) => callback();
global.IS_REACT_ACT_ENVIRONMENT = true;
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith("@/"))
    request = path.resolve(__dirname, "../src", request.slice(2));
  return resolve.call(this, request, ...args);
};
for (const extension of [".ts", ".tsx"])
  require.extensions[extension] = (mod, filename) =>
    mod._compile(
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
require.extensions[".css"] = () => {};
const React = require("react"),
  { act } = React,
  { createRoot } = require("react-dom/client");
function mock(file, exports) {
  const name = require.resolve(file);
  require.cache[name] = { id: name, filename: name, loaded: true, exports };
}
let calls = [],
  records = [],
  allow = true,
  failCreate = 0,
  selected = [],
  parentSaves = 0;
const company = "aaaaaaaaaaaaaaaaaaaaaaaa";
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
mock("../src/hooks/useDebouncedValue.ts", {
  useDebouncedValue: (value) => value,
});
mock("next/navigation", {
  useRouter: () => ({
    push() {
      throw new Error("Unexpected navigation");
    },
    replace() {
      throw new Error("Unexpected navigation");
    },
  }),
});
mock("../src/context/UserContext.tsx", {
  useUser: () => ({
    user: {
      _id: "actor",
      companyIds: [company],
      access: {
        modelAccess: {
          leads: { read: true, create: true, write: true, delete: true },
        },
        currentCompanyId: company,
      },
    },
    loading: false,
  }),
});
mock("../src/context/ViewSearchContext.tsx", {
  useViewSearch: () => ({
    state: { query: "", filters: [] },
    configure() {
      throw new Error("Nested form changed global search");
    },
    reset() {},
  }),
});
mock("../src/lib/orm_service.ts", {
  apiFetch: async (options) => {
    calls.push(options);
    const payload = options.payload ? JSON.parse(options.payload) : {};
    if (options.url.endsWith("/access"))
      return reply({ read: true, create: allow });
    if (options.url.endsWith("/read"))
      return reply({ _id: company, name: "Workspace company" });
    if (options.url.endsWith("/search")) {
      const ids = payload.domain?.find((domain) => domain[0] === "_id")?.[2];
      const query = payload.search?.query?.toLowerCase() || "";
      return reply(
        records.filter(
          (record) =>
            (!ids || ids.includes(record._id)) &&
            record.name.toLowerCase().includes(query),
        ),
      );
    }
    if (failCreate)
      return reply(
        { errors: [{ field: "categoryId", message: "Category required" }] },
        failCreate,
      );
    const record = { _id: "cccccccccccccccccccccccc", ...payload };
    records.push(record);
    return reply(record, 201);
  },
});
const {
  ManyToManyWidget,
} = require("../src/components/core/widgets/many2many.tsx");
const {
  ColorWidget,
  COLOR_PRESETS,
} = require("../src/components/core/widgets/color.tsx");
const { crmConfigs } = require("../src/config/crm-models.ts");
const service = require("../src/lib/relation-service.ts");
const colors = require("../src/lib/color.ts");
const relation = {
  model: "CrmTag",
  labelField: "name",
  colorField: "color",
  recordLabel: "Tag",
  recordLabelPlural: "Tags",
  companyField: "companyId",
  contextCompanyId: company,
  creationDefaults: { companyId: company },
  domain: [["companyId", "=", company]],
  formConfig: crmConfigs.tags,
};
const field = { name: "tagIds", label: "Tags", widget: "many2many", relation };
let root, container;
async function render(props = {}, Component = ManyToManyWidget) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  function Host() {
    const [value, setValue] = React.useState(props.value || []);
    return React.createElement(
      "form",
      {
        onSubmit: (event) => {
          event.preventDefault();
          parentSaves++;
        },
      },
      React.createElement(Component, {
        field,
        ...props,
        value,
        onChange: (next) => {
          selected = next;
          setValue(next);
        },
      }),
    );
  }
  await act(async () => root.render(React.createElement(Host)));
}
const button = (text) =>
  [...document.querySelectorAll("button")].find((element) =>
    element.textContent.includes(text),
  );
async function click(element) {
  assert.ok(element, "Expected control exists");
  await act(async () => element.click());
}
async function type(
  value,
  input = document.querySelector('[role="combobox"]'),
) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      "value",
    ).set.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}
async function key(key) {
  await act(async () =>
    document
      .querySelector('[role="combobox"]')
      .dispatchEvent(
        new dom.window.KeyboardEvent("keydown", { key, bubbles: true }),
      ),
  );
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = undefined;
  calls = [];
  records = [];
  allow = true;
  failCreate = 0;
  selected = [];
  parentSaves = 0;
  document.documentElement.className = "";
});
after(() => dom.window.close());

for (const theme of ["light", "dark"])
  test(`${theme}: resolves colored chips, selects multiple and removes IDs without object payloads`, async () => {
    document.documentElement.className = theme;
    records = [
      { _id: "a", name: "Enterprise", color: "#3b82f6" },
      { _id: "b", name: "Referral" },
      { _id: "c", name: "Priority", color: "#ffffff" },
    ];
    await render({ value: ["a"] });
    assert.match(container.textContent, /Enterprise/);
    assert.equal(
      container.querySelector("[style]").style.backgroundColor,
      "rgb(59, 130, 246)",
    );
    assert.equal(
      container.querySelector("[style]").style.color,
      "rgb(0, 0, 0)",
    );
    await click(button("Select tag"));
    await key("ArrowDown");
    await key("Enter");
    await key("ArrowDown");
    await key("Enter");
    assert.deepEqual(selected, ["a", "b", "c"]);
    await key("Escape");
    await click(document.querySelector('[aria-label="Remove Referral"]'));
    assert.deepEqual(selected, ["a", "c"]);
    assert.equal(parentSaves, 0);
    const payload = JSON.parse(
      calls.find((call) => call.url.endsWith("/search")).payload,
    );
    assert.deepEqual(payload.fields, ["_id", "name", "color"]);
    assert.ok(
      payload.domain.some(
        (domain) => domain[0] === "companyId" && domain[2] === company,
      ),
    );
  });

test("creation is opt-in and denied create rights hide both actions", async () => {
  await render();
  await click(button("Select tag"));
  await type("VIP");
  assert.equal(button("Create “"), undefined);
  assert.equal(
    calls.some((call) => call.url.endsWith("/access")),
    false,
  );
  await act(async () => root.unmount());
  root = undefined;
  container.remove();
  calls = [];
  allow = false;
  await render({ field: { ...field, create: true } });
  await click(button("Select tag"));
  await type("VIP");
  assert.equal(button("Create “"), undefined);
  assert.equal(button("Create and Edit"), undefined);
});

test("quick creates, automatically selects, and keeps the parent form unsaved", async () => {
  await render({ field: { ...field, create: true } });
  await click(button("Select tag"));
  await type("VIP");
  await key("Enter");
  assert.deepEqual(selected, ["cccccccccccccccccccccccc"]);
  assert.match(container.textContent, /VIP/);
  const creates = calls.filter((call) => call.url === "/api/CrmTag");
  assert.equal(creates.length, 1);
  assert.deepEqual(JSON.parse(creates[0].payload), {
    name: "VIP",
    companyId: company,
    color: "",
  });
  assert.equal(parentSaves, 0);
});

test("an exact case-insensitive existing name suppresses creation", async () => {
  records = [{ _id: "a", name: "Enterprise" }];
  await render({ field: { ...field, create: true } });
  await click(button("Select tag"));
  await type("enterprise");
  assert.equal(button("Create “"), undefined);
  await key("Enter");
  assert.deepEqual(selected, ["a"]);
});

test("Create and Edit uses the real generic form, prefilled name, Color widget and no parent submission", async () => {
  await render({ field: { ...field, create: true } });
  await click(button("Select tag"));
  await type("Priority Customer");
  await click(button("Create and Edit"));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  assert.equal(document.getElementById("name").value, "Priority Customer");
  assert.ok(document.querySelector('input[type="color"]'));
  await click(document.querySelector('[aria-label="Use #3b82f6"]'));
  await click(button("Save"));
  assert.equal(records[0].color, "#3b82f6");
  assert.deepEqual(selected, ["cccccccccccccccccccccccc"]);
  assert.equal(parentSaves, 0);
});

test("missing required metadata opens the generic form without making an invalid create request", async () => {
  const config = {
    ...crmConfigs.tags,
    form: {
      ...crmConfigs.tags.form,
      sections: [
        {
          id: "general",
          fields: [
            { name: "name", label: "Name", widget: "text", required: true },
            {
              name: "categoryId",
              label: "Category",
              widget: "text",
              required: true,
            },
          ],
        },
      ],
    },
  };
  await render({
    field: {
      ...field,
      create: true,
      relation: { ...relation, formConfig: config },
    },
  });
  await click(button("Select tag"));
  await type("Needs details");
  await key("Enter");
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  assert.equal(document.getElementById("name").value, "Needs details");
  assert.ok(document.getElementById("categoryId"));
  assert.equal(
    calls.some((call) => call.url === "/api/CrmTag"),
    false,
  );
});

test("backend validation falls back to form; direct permission failure does not", async () => {
  failCreate = 400;
  assert.deepEqual(
    await service.quickCreateRelation(relation, "Extra required"),
    { requiresForm: true },
  );
  failCreate = 403;
  await assert.rejects(
    service.quickCreateRelation(relation, "Denied"),
    /permission/,
  );
});

test("nested Ctrl+S saves only the relation, and cancelling retains the parent draft", async () => {
  const {
    FormView,
  } = require("../src/components/core/views/shared/FormView.tsx");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  function Parent() {
    const [data, setData] = React.useState({
      _id: "lead",
      companyId: company,
      title: "Unsaved parent title",
      tagIds: [],
    });
    return React.createElement(FormView, {
      data,
      title: data.title,
      dirty: true,
      sections: [{ id: "main", fields: [{ ...field, create: true }] }],
      onChange: (key, value) => {
        selected = value;
        setData((previous) => ({ ...previous, [key]: value }));
      },
      onSave: () => {
        parentSaves++;
      },
    });
  }
  await act(async () => root.render(React.createElement(Parent)));
  await click(button("Select tag"));
  await type("Nested save");
  await click(button("Create and Edit"));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  await act(async () => {
    document.getElementById("name").focus();
    window.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });
  assert.equal(parentSaves, 0);
  assert.equal(records.length, 1);
  assert.equal(records[0].name, "Nested save");
  assert.match(container.textContent, /Unsaved parent title/);
  await click(button("Select tag"));
  await type("Cancelled tag");
  await click(button("Create and Edit"));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  const previousConfirm = window.confirm;
  window.confirm = () => true;
  const backButtons = [...document.querySelectorAll("button")].filter(
    (button) => button.getAttribute("aria-label")?.includes("Back"),
  );
  await click(backButtons.at(-1));
  window.confirm = previousConfirm;
  assert.match(container.textContent, /Unsaved parent title/);
  assert.equal(records.length, 1);
  assert.equal(parentSaves, 0);
});

test("readonly and disabled colors cannot be changed", async () => {
  await render(
    {
      field: { name: "color", label: "Color", widget: "color" },
      value: "#3b82f6",
      readonly: true,
    },
    ColorWidget,
  );
  assert.equal(document.querySelector('input[type="color"]'), null);
  assert.equal(button("Clear color"), undefined);
  await act(async () => root.unmount());
  root = undefined;
  container.remove();
  await render(
    {
      field: { name: "color", label: "Color", widget: "color" },
      value: "#3b82f6",
      disabled: true,
    },
    ColorWidget,
  );
  assert.equal(document.querySelector('input[type="color"]').disabled, true);
  await click(document.querySelector('[aria-label="Use #ef4444"]'));
  assert.deepEqual(selected, []);
});

test("selected records are chunked and malformed/color-less values never render raw IDs or unsafe styles", async () => {
  await service.loadSelectedRelations(
    relation,
    Array.from({ length: 450 }, (_, index) => String(index)),
  );
  assert.deepEqual(
    calls.map((call) => JSON.parse(call.payload).limit),
    [200, 200, 50],
  );
  await render({ value: ["unavailable-object-id"], readonly: true });
  assert.doesNotMatch(container.textContent, /unavailable-object-id/);
  assert.match(container.textContent, /Unavailable record/);
  assert.equal(colors.relationColorStyle("url(evil)"), undefined);
});

for (const theme of ["light", "dark"])
  test(`${theme}: Color widget presets, clear, readonly and contrast`, async () => {
    document.documentElement.className = theme;
    await render(
      {
        field: { name: "color", label: "Color", widget: "color" },
        value: "#3b82f6",
      },
      ColorWidget,
    );
    await click(document.querySelector('[aria-label="Use #ef4444"]'));
    assert.equal(selected, "#ef4444");
    await click(button("Clear color"));
    assert.equal(selected, "");
    assert.equal(document.querySelectorAll('[aria-label^="Use #"]').length, 12);
    for (const background of [...COLOR_PRESETS, "#000000", "#ffffff"]) {
      const channels = [1, 3, 5]
        .map(
          (offset) => parseInt(background.slice(offset, offset + 2), 16) / 255,
        )
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      const luminance =
        channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      const ratio =
        colors.getContrastTextColor(background) === "#000000"
          ? (luminance + 0.05) / 0.05
          : 1.05 / (luminance + 0.05);
      assert.ok(ratio >= 4.5);
    }
  });

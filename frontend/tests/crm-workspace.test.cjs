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
const React = require("react"),
  { act } = React,
  { createRoot } = require("react-dom/client");
const {
  crmLeadConfig,
  crmOpportunityConfig,
  crmConfigs,
} = require("../src/config/crm-models.ts");
let form, list, calls, routes, user, api;
const noop = () => {};
const search = {
  state: { query: "", filters: [], searchField: null },
  configure: noop,
  reset: noop,
};
const router = {
  push: (url) => routes.push(url),
  replace: (url) => routes.push(url),
};
function mock(file, exports) {
  const resolved = require.resolve(file);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}
mock("next/navigation", { useRouter: () => router });
mock("../src/context/UserContext.tsx", {
  useUser: () => ({ user, loading: false }),
});
mock("../src/context/ViewSearchContext.tsx", { useViewSearch: () => search });
mock("../src/hooks/useDebouncedValue.ts", {
  useDebouncedValue: (value) => value,
});
mock("../src/lib/orm_service.ts", {
  apiFetch: async (options) => {
    calls.push(options);
    return api(options);
  },
});
mock("../src/components/core/views/shared/FormView.tsx", {
  FormView: (props) => {
    form = props;
    return React.createElement(
      "div",
      null,
      props.actions,
      props.formError &&
        React.createElement("p", { role: "alert" }, props.formError),
    );
  },
  FormViewSkeleton: () => React.createElement("div", null, "Loading"),
});
mock("../src/components/core/views/shared/ListView.tsx", {
  ListView: (props) => {
    list = props;
    return React.createElement(
      "div",
      null,
      ...props.records.map((record) =>
        React.createElement("div", { key: record._id }, record.name),
      ),
    );
  },
});
const {
  ModelWorkspace,
} = require("../src/components/core/views/shared/ModelWorkspace.tsx");
const { TextWidget } = require("../src/components/core/widgets/text.tsx");
const company = "aaaaaaaaaaaaaaaaaaaaaaaa",
  id = "bbbbbbbbbbbbbbbbbbbbbbbb";
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
let root, container;
async function render(config, recordId, record = {}) {
  calls = [];
  routes = [];
  form = undefined;
  list = undefined;
  user = {
    _id: "cccccccccccccccccccccccc",
    companyIds: [company],
    access: {
      modelAccess: {
        leads: { read: true, create: true, write: true, delete: true },
      },
      currentCompanyId: null,
    },
  };
  api = (options) =>
    reply(
      options.url.endsWith("/search")
        ? { records: [], total: 0, limit: 24, offset: 0 }
        : { _id: id, ...config.form.defaults, ...record },
    );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(ModelWorkspace, { config, recordId })),
  );
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  root = undefined;
  container?.remove();
});
after(() => dom.window.close());
const button = (label) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === label);
async function click(element) {
  assert.ok(element, "button exists");
  await act(async () => element.click());
}

test("both record types share one model and generic metadata; no Kanban views", () => {
  assert.equal(crmLeadConfig.model, "CrmLead");
  assert.equal(crmOpportunityConfig.model, "CrmLead");
  assert.deepEqual(crmLeadConfig.baseDomain, [["type", "=", "lead"]]);
  assert.deepEqual(crmOpportunityConfig.baseDomain, [
    ["type", "=", "opportunity"],
  ]);
  assert.equal(crmOpportunityConfig.search.defaultView, "list");
  assert.equal(crmConfigs.stages.model, "CrmStage");
  assert.equal(crmConfigs.tags.model, "CrmTag");
  assert.ok(!crmLeadConfig.writableFields.includes("status"));
});
test("list requests include the permanent type domain, pagination, search and sorting", async () => {
  await render(crmOpportunityConfig);
  const body = JSON.parse(calls.find((c) => c.url.endsWith("/search")).payload);
  assert.deepEqual(body.domain, [["type", "=", "opportunity"]]);
  assert.equal(body.withCount, true);
  assert.equal(body.limit, 24);
  assert.equal(body.order, "createdAt desc");
  assert.deepEqual(body.search.fields, [
    "name",
    "contactName",
    "companyName",
    "email",
    "phone",
  ]);
});
test("new form uses company and salesperson defaults; save includes create-only type", async () => {
  await render(crmLeadConfig, "new");
  assert.equal(form.data.companyId, company);
  assert.equal(form.data.userId, user._id);
  assert.equal(form.dirty, false);
  await act(async () => form.onChange("name", "New requirement"));
  assert.equal(form.dirty, true);
  api = (options) => reply({ _id: id, ...JSON.parse(options.payload) }, 201);
  await act(async () => form.onSave());
  const body = JSON.parse(calls.find((c) => c.url === "/api/CrmLead").payload);
  assert.equal(body.type, "lead");
  assert.equal(body.name, "New requirement");
  assert.ok(!("status" in body));
  assert.equal(form.dirty, false);
  assert.deepEqual(routes, ["/web/crm/leads/" + id]);
});
test("ordinary updates never submit conversion or status fields, and date input is normalized", async () => {
  await render(crmOpportunityConfig, id, {
    name: "Deal",
    companyId: company,
    dateDeadline: "2026-12-01T00:00:00.000Z",
  });
  assert.equal(form.data.dateDeadline, "2026-12-01");
  await act(async () => form.onChange("expectedRevenue", 25000));
  api = (options) =>
    reply({
      _id: id,
      ...crmOpportunityConfig.form.defaults,
      ...JSON.parse(options.payload),
    });
  await act(async () => form.onSave());
  const body = JSON.parse(calls.find((c) => c.method === "PUT").payload);
  assert.equal(body.expectedRevenue, 25000);
  assert.ok(!("type" in body));
  assert.ok(!("status" in body));
  assert.ok(!("convertedAt" in body));
});
test("invalid numeric fields block save and report field errors", async () => {
  await render(crmOpportunityConfig, id, { name: "Deal", companyId: company });
  await act(async () => form.onChange("probability", 101));
  await act(async () => form.onSave());
  assert.ok(form.errors.probability);
  assert.ok(!calls.some((c) => c.method === "PUT"));
});
test("dirty changes disable conversion, and Discard restores the original data", async () => {
  await render(crmLeadConfig, id, { name: "Lead", companyId: company });
  assert.equal(button("Convert to Opportunity").disabled, false);
  await act(async () => form.onChange("name", "Changed"));
  assert.equal(button("Convert to Opportunity").disabled, true);
  await act(async () => form.onDiscard());
  assert.equal(form.data.name, "Lead");
  assert.equal(form.dirty, false);
  assert.equal(button("Convert to Opportunity").disabled, false);
});
test("conversion requires confirmation and redirects to the same opportunity ID", async () => {
  await render(crmLeadConfig, id, { name: "Lead", companyId: company });
  await click(button("Convert to Opportunity"));
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.ok(!calls.some((c) => c.url.includes("/convert")));
  api = () =>
    reply({
      _id: id,
      ...crmOpportunityConfig.form.defaults,
      name: "Lead",
      companyId: company,
    });
  const confirm = [
    ...document.querySelector('[role="dialog"]').querySelectorAll("button"),
  ].find((b) => b.textContent === "Convert to Opportunity");
  await click(confirm);
  assert.deepEqual(routes, ["/web/crm/opportunities/" + id]);
  assert.equal(calls.filter((c) => c.url.includes("/convert")).length, 1);
});
test("closed opportunity offers Reopen, and lost reason remains read-only metadata", async () => {
  await render(crmOpportunityConfig, id, {
    name: "Closed deal",
    companyId: company,
    status: "lost",
    lostReason: "Budget",
  });
  assert.ok(button("Reopen"));
  assert.ok(!button("Mark Won"));
  assert.ok(!button("Mark Lost"));
  const audit = crmOpportunityConfig.form.notebooks.find(
    (n) => n.id === "history",
  );
  assert.equal(
    audit.sections[0].fields.find((f) => f.name === "lostReason").readonly,
    true,
  );
});
test("company-specific read-only access hides mutation actions despite unioned user rights", async () => {
  await render(crmLeadConfig, id, {
    name: "Read only",
    companyId: company,
    _access: { read: true, write: false, delete: false },
  });
  assert.equal(form.readonly, true);
  assert.ok(!button("Convert to Opportunity"));
  assert.ok(!button("Delete"));
});
test("opening an old lead URL after conversion resolves to the opportunity form", async () => {
  await render(crmLeadConfig, id, {
    name: "Converted",
    companyId: company,
    type: "opportunity",
  });
  assert.deepEqual(routes, ["/web/crm/opportunities/" + id]);
});
test("number widget exposes native numeric constraints and accessible labels", async () => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      React.createElement(TextWidget, {
        field: {
          name: "probability",
          label: "Probability",
          widget: "number",
          min: 0,
          max: 100,
          step: 1,
        },
        value: 25,
      }),
    ),
  );
  const input = document.getElementById("probability");
  assert.equal(input.type, "number");
  assert.equal(input.min, "0");
  assert.equal(input.max, "100");
  assert.equal(input.step, "1");
  assert.equal(
    document.querySelector('label[for="probability"]').textContent,
    "Probability",
  );
});

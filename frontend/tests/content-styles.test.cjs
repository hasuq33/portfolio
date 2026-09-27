const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const css = fs.readFileSync(
  path.join(
    __dirname,
    "../src/components/core/widgets/editor/rich-content.css",
  ),
  "utf8",
);

function sample(dark, html) {
  const dom = new JSDOM(
    `<html class="${dark ? "dark" : ""}"><head><style>${css}</style></head><body><article class="rich-content">${html}</article></body></html>`,
  );
  const root = dom.window.document.querySelector(".rich-content");
  return {
    dom,
    root,
    rule: (selector) =>
      [...dom.window.document.styleSheets[0].cssRules].find(
        (rule) => rule.selectorText === selector,
      )?.style,
    style: (selector) =>
      dom.window.getComputedStyle(
        selector ? root.querySelector(selector) : root,
      ),
  };
}

for (const dark of [false, true]) {
  test(`${dark ? "dark" : "light"} content uses readable theme defaults`, () => {
    const { dom, style, rule } = sample(
      dark,
      '<h1>Heading</h1><p>Text <a href="/blog">Link</a></p><table><tbody><tr><th>Header</th><td>Cell</td></tr></tbody></table><hr><pre><code>let x = 1;</code></pre>',
    );
    try {
      // JSDOM does not resolve CSS variables. Check token selection here;
      // real-browser QA checks resolved colors and cross-renderer parity.
      assert.equal(style().color, "var(--content-text)");
      assert.equal(
        style().getPropertyValue("--content-text"),
        dark ? "#e5e7eb" : "#334155",
      );
      assert.equal(style("h1").color, "var(--content-heading)");
      assert.equal(
        style().getPropertyValue("--content-heading"),
        dark ? "#f3f4f6" : "#111827",
      );
      assert.equal(style("a").color, "var(--content-link)");
      assert.equal(
        style().getPropertyValue("--content-link"),
        dark ? "#60a5fa" : "#2563eb",
      );
      assert.equal(
        rule(".rich-content :where(table)").getPropertyValue("background"),
        "var(--content-table)",
      );
      assert.equal(
        style().getPropertyValue("--content-table"),
        dark ? "#111827" : "#ffffff",
      );
      assert.equal(style("table").tableLayout, "fixed");
      assert.equal(
        rule(".rich-content :where(hr)").getPropertyValue("border-block-start"),
        "1px solid var(--content-border)",
      );
      assert.equal(
        style().getPropertyValue("--content-border"),
        dark ? "#475569" : "#cbd5e1",
      );
      assert.equal(style("pre").whiteSpace, "pre");
      assert.equal(style("pre").overflowX, "auto");
      assert.equal(style().overflowX, "auto");
    } finally {
      dom.window.close();
    }
  });
  test(`${dark ? "dark" : "light"} content respects author colors, fonts and alignment`, () => {
    const { dom, style } = sample(
      dark,
      '<h2 style="color:#3586c0;font-size:27px;font-family:Georgia;text-align:right">Custom</h2><p><span style="background-color:#fef08a">Default highlight</span></p><p class="custom" style="color:#9333ea"><span style="background-color:#fef08a">Inherited custom color</span></p><p class="explicit"><span style="background-color:#111827;color:#ffffff">Custom highlight</span></p>',
    );
    try {
      assert.equal(style("h2").color, "rgb(53, 134, 192)");
      assert.equal(style("h2").fontSize, "27px");
      assert.equal(style("h2").fontFamily, "Georgia");
      assert.equal(style("h2").textAlign, "right");
      assert.equal(style("p span").color, "var(--content-highlight-text)");
      assert.equal(
        style().getPropertyValue("--content-highlight-text"),
        "#1f2937",
      );
      assert.equal(style("p span").backgroundColor, "rgb(254, 240, 138)");
      assert.equal(style(".custom span").color, "rgb(147, 51, 234)");
      assert.equal(style(".explicit span").color, "rgb(255, 255, 255)");
      assert.equal(style(".explicit span").backgroundColor, "rgb(17, 24, 39)");
    } finally {
      dom.window.close();
    }
  });
}

test("editor-only decoration is separate from published typography", () => {
  assert.doesNotMatch(
    css,
    /::selection|content:\s*"Type \/ for commands"|!important/,
  );
  const article = fs.readFileSync(
    path.join(__dirname, "../src/components/website/BlogArticle.tsx"),
    "utf8",
  );
  assert.match(article, /rich-content\.css/);
  assert.doesNotMatch(article, /editor-content\.css/);
});

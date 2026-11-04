import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Col, Layout, Row } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Row / Col", () => {
  test("Row: gutter is one value or a pair, no gap by default; data-nowrap only with wrap=false", () => {
    expect(ssr(createElement(Row, { children: "x" }))).toContain('data-gutter="none"');
    const pair = ssr(createElement(Row, { gutter: ["lg", "xs"], justify: "between" }));
    expect(pair).toContain('data-gutter="lg"');
    expect(pair).toContain('data-gutter-y="xs"');
    expect(pair).toContain('data-justify="between"');
    expect(pair).not.toContain("data-nowrap");
    expect(ssr(createElement(Row, { wrap: false }))).toContain("data-nowrap");
  });

  test("Col: span / offset / order are rounded and clamped to 0–24, no attribute when not given", () => {
    expect(ssr(createElement(Col, { children: "x" }))).not.toContain("data-span");
    const html = ssr(createElement(Col, { span: 30, offset: -2, order: 3.6 }));
    expect(html).toContain('data-span="24"');
    expect(html).toContain('data-offset="0"');
    expect(html).toContain('data-order="4"');
  });

  test("Col: breakpoints become data-<breakpoint>-xxx, a number is short for span, an object can carry offset / order", () => {
    const html = ssr(
      createElement(Col, { span: 24, md: 12, xxl: { span: 6, offset: 2, order: 1 } }),
    );
    expect(html).toContain('data-md-span="12"');
    expect(html).not.toContain("data-md-offset");
    expect(html).toContain('data-xxl-span="6"');
    expect(html).toContain('data-xxl-offset="2"');
    expect(html).toContain('data-xxl-order="1"');
  });

  test("Col: no className / style, as changes the element", () => {
    const html = ssr(createElement(Col, { as: "section", span: 8 }));
    expect(html).toMatch(/^<section /);
    expect(html).not.toMatch(/class=|style=/);
  });
});

describe("Layout", () => {
  test("semantic elements: Layout is a section, Header / Content / Footer use the matching tags", () => {
    const html = ssr(
      createElement(
        Layout,
        null,
        createElement(Layout.Header, null, "h"),
        createElement(Layout.Content, null, "c"),
        createElement(Layout.Footer, null, "f"),
      ),
    );
    expect(html).toMatch(/^<section[^>]*data-slot="layout"/);
    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
  });

  test("can be nested, no className / style", () => {
    const html = ssr(
      createElement(
        Layout,
        null,
        createElement(Layout, null, createElement(Layout.Header, null, "h")),
      ),
    );
    expect(html).not.toMatch(/class=|style=/);
  });
});

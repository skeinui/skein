import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { PAGE_HEADER_SLOTS, PAGE_SLOTS } from "../src/contract.ts";
import { Page, PageFooter, PageHeader } from "../src/index.ts";
import { withoutScrollAreaInternals } from "./base-ui-markup.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("PageHeader", () => {
  test("nothing to show: nothing is rendered", () => {
    expect(ssr(createElement(PageHeader, {}))).toBe("");
  });

  test("the title and the description on the left, the actions on the right; every slot, no class", () => {
    const html = ssr(
      createElement(PageHeader, {
        title: "Tickets",
        description: "Every request",
        actions: createElement("button", null, "New"),
      }),
    );
    for (const slot of PAGE_HEADER_SLOTS) expect(html).toContain(`data-slot="${slot}"`);
    expect(html).toContain("Tickets");
    expect(html).toContain("Every request");
    expect(html).toContain("<button>New</button>");
    expect(html).not.toContain("class=");
  });

  test("the title is an h3 unless `level` says otherwise; no actions, no actions slot", () => {
    expect(ssr(createElement(PageHeader, { title: "A" }))).toContain("<h3");
    const h1 = ssr(createElement(PageHeader, { title: "A", level: 1 }));
    expect(h1).toContain("<h1");
    expect(h1).not.toContain("page-header-actions");
  });

  test("only actions: still a header (a page with a button and no title)", () => {
    const html = ssr(createElement(PageHeader, { actions: "New" }));
    expect(html).toContain("page-header-actions");
    expect(html).not.toContain("<h3");
  });
});

describe("Page and PageFooter", () => {
  test("a Page frames the header, the body and the footer; every slot, no class", () => {
    const html = ssr(
      createElement(
        Page,
        {
          title: "Tickets",
          actions: "New",
          footer: createElement(PageFooter, { sticky: true }, "Save"),
        },
        createElement("p", null, "content"),
      ),
    );
    for (const slot of PAGE_SLOTS) expect(html).toContain(`data-slot="${slot}"`);
    for (const slot of PAGE_HEADER_SLOTS) expect(html).toContain(`data-slot="${slot}"`);
    expect(html.indexOf("page-header")).toBeLessThan(html.indexOf("page-body"));
    expect(html.indexOf("page-body")).toBeLessThan(html.indexOf("page-footer"));
    expect(html).toContain("<p>content</p>");
    expect(withoutScrollAreaInternals(html)).not.toContain("class=");
  });

  test("`fill` is written only when asked; a page without a title has no header", () => {
    expect(ssr(createElement(Page, { fill: true }, "x"))).toContain("data-fill");
    const plain = ssr(createElement(Page, {}, "x"));
    expect(plain).not.toContain("data-fill");
    expect(plain).not.toContain("page-header");
  });

  test("PageFooter: aligned to the end by default, `sticky` and `align` are hooks", () => {
    expect(ssr(createElement(PageFooter, {}, "x"))).toContain('data-align="end"');
    expect(ssr(createElement(PageFooter, {}, "x"))).not.toContain("data-sticky");
    const html = ssr(createElement(PageFooter, { align: "between", sticky: true }, "x"));
    expect(html).toContain('data-align="between"');
    expect(html).toContain("data-sticky");
  });
});

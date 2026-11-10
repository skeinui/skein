import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { PAGE_HEADER_SLOTS } from "../src/contract.ts";
import { PageHeader } from "../src/index.ts";

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

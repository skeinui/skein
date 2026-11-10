// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Pagination, Table, getPageItems } from "../src/index.ts";
import { withoutScrollAreaInternals } from "./base-ui-markup.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("getPageItems", () => {
  test("lists all pages when there are few", () => {
    expect(getPageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  test("near the start: ellipsis on the right, fixed total length", () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
    expect(getPageItems(3, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });
  test("in the middle: ellipsis on both sides", () => {
    expect(getPageItems(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });
  test("near the end: ellipsis on the left", () => {
    expect(getPageItems(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });
});

describe("Table (SSR)", () => {
  const demo = (props = {}) =>
    ssr(
      createElement(
        Table,
        { striped: true, bordered: true, stickyHeader: true, ...props },
        createElement(
          Table.Header,
          null,
          createElement(
            Table.Row,
            null,
            createElement(Table.Head, { kind: "select" }, ""),
            createElement(Table.Head, { sortable: true, sort: "asc" }, "Name"),
            createElement(Table.Head, { align: "end" }, "Age"),
          ),
        ),
        createElement(
          Table.Body,
          null,
          createElement(
            Table.Row,
            { selected: true },
            createElement(Table.Cell, { kind: "select" }, "x"),
            createElement(Table.Cell, null, "Ann"),
            createElement(Table.Cell, { align: "end" }, "30"),
          ),
          createElement(Table.Empty, { colSpan: 3 }, "No data"),
        ),
      ),
    );

  test("the container and table carry their hooks, no styles", () => {
    const html = demo({ stickyHeader: false });
    expect(html).toContain('data-slot="table-container"');
    expect(html).toContain("data-bordered");
    expect(html).not.toContain("data-sticky");
    // Sideways only: the table is in a ScrollArea here too, so its scrollbar is the theme style's
    expect(html).toContain('data-slot="scroll-area-viewport"');
    expect(html).toContain('data-slot="table"');
    expect(html).toContain('data-size="md"');
    expect(html).toContain("data-striped");
    expect(html).toContain("data-hoverable");
    expect(withoutScrollAreaInternals(html)).not.toContain("class=");
    expect(withoutScrollAreaInternals(html)).not.toContain("style=");
  });

  test("a fixed header puts the table in a ScrollArea inside the container (the container does not scroll), and the table keeps its hooks", () => {
    const html = demo({ stickyHeader: true });
    expect(html).toContain("data-sticky");
    expect(html).toMatch(
      /data-slot="table-container"[^>]*>(?:(?!<\/div>).)*data-slot="scroll-area"[^>]*>.*data-slot="scroll-area-viewport".*<table[^>]*data-slot="table"/s,
    );
    expect(html).toContain('data-slot="scroll-area-viewport"');
    expect(html).toContain('data-size="md"');
    expect(html).toContain("data-striped");
  });

  test("Table.Row `active` is data-active and aria-current (not aria-selected); `interactive` is a data attribute; `nowrap` goes on cells and heads", () => {
    const html = ssr(
      createElement(
        Table,
        null,
        createElement(
          Table.Body,
          null,
          createElement(
            Table.Row,
            { active: true, interactive: true },
            createElement(Table.Cell, { nowrap: true }, "a"),
          ),
          createElement(Table.Row, null, createElement(Table.Cell, null, "b")),
        ),
      ),
    );
    expect(html).toContain("data-active");
    expect(html).toContain('aria-current="true"');
    expect(html).not.toContain("aria-selected");
    expect(html).toContain("data-interactive");
    expect(html.match(/data-nowrap/g)).toHaveLength(1);
    const head = ssr(createElement(Table, null, createElement(Table.Head, { nowrap: true }, "h")));
    expect(head).toContain("data-nowrap");
  });

  test("sortable headers get aria-sort, data-sort, a button and an icon", () => {
    const html = demo();
    expect(html).toContain('aria-sort="ascending"');
    expect(html).toContain('data-sort="asc"');
    expect(html).toContain('data-slot="table-sort-button"');
    expect(html).toContain('data-slot="table-sort-icon"');
  });

  test("selected rows, alignment, select column, empty state", () => {
    const html = demo();
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("data-selected");
    expect(html).toContain('data-align="end"');
    expect(html).toContain('data-kind="select"');
    expect(html).toContain('data-slot="table-empty"');
    expect(html).toMatch(/colspan="3"/i);
  });

  test("loading sets data-loading and aria-busy", () => {
    const html = demo({ loading: true });
    expect(html).toContain("data-loading");
    expect(html).toContain('aria-busy="true"');
  });
});

describe("Pagination (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
  });
  async function mount(node: React.ReactNode) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => root.render(node));
    return el;
  }

  test("simple: shows the total and page, the first-page button is disabled on page 1, next calls back", async () => {
    const calls: number[] = [];
    const el = await mount(
      createElement(Pagination, {
        page: 1,
        pageSize: 10,
        total: 95,
        selectedCount: 2,
        onPageChange: (p: number) => calls.push(p),
      }),
    );
    expect(el.querySelector('[data-slot="pagination-info"]')?.textContent).toContain("2 selected");
    expect(el.querySelector('[data-slot="pagination-info"]')?.textContent).toContain("95 items");
    expect(el.querySelector('[data-slot="pagination-page-info"]')?.textContent).toBe(
      "Page 1 of 10",
    );
    const prev = el.querySelector('[aria-label="Previous page"]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    await act(async () => (el.querySelector('[aria-label="Next page"]') as HTMLElement).click());
    expect(calls).toEqual([2]);
    await act(async () => (el.querySelector('[aria-label="Last page"]') as HTMLElement).click());
    expect(calls).toEqual([2, 10]);
  });

  test("pages: renders page numbers and ellipses, the current page has aria-current", async () => {
    const calls: number[] = [];
    const el = await mount(
      createElement(Pagination, {
        variant: "pages",
        page: 10,
        pageSize: 10,
        total: 200,
        onPageChange: (p: number) => calls.push(p),
      }),
    );
    expect(el.querySelectorAll('[data-slot="pagination-ellipsis"]').length).toBe(2);
    expect(el.querySelector('[aria-current="page"]')?.textContent).toBe("10");
    await act(async () => (el.querySelector('[aria-label="Page 11"]') as HTMLElement).click());
    expect(calls).toEqual([11]);
  });

  test("texts can be overridden", async () => {
    const el = await mount(
      createElement(Pagination, {
        page: 2,
        pageSize: 10,
        total: 30,
        onPageChange: () => undefined,
        labels: {
          total: (n: number) => `${n} in total`,
          page: (c: number, t: number) => `${c} of ${t}`,
        },
      }),
    );
    expect(el.textContent).toContain("30 in total");
    expect(el.textContent).toContain("2 of 3");
  });
});

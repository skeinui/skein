import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { List } from "../src/index.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("List", () => {
  test("items: one li per item, keyed; avatar / title / description / extra / actions each have a slot; no class / style", () => {
    const html = ssr(
      createElement(List, {
        items: [
          {
            key: "a",
            avatar: createElement("i", null, "A"),
            title: "Alpha",
            description: "First",
            extra: "10:00",
            actions: ["edit", "more"],
          },
          { key: "b", title: "Beta" },
        ],
      }),
    );
    expect(html.match(/data-slot="list-item"/g)).toHaveLength(2);
    expect(html).toMatch(/<ul[^>]*data-slot="list-items"/);
    for (const slot of [
      "list-meta",
      "list-avatar",
      "list-content",
      "list-title",
      "list-description",
      "list-extra",
      "list-actions",
    ]) {
      expect(html).toContain(`data-slot="${slot}"`);
    }
    // One li per action
    expect(html.match(/<li>(edit|more)<\/li>/g)).toHaveLength(2);
    // An item with only a title has no description / avatar
    expect(html.split('data-slot="list-item"')[2]).not.toContain("list-description");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("List.Item children are equivalent to items; an item's children go between meta and extra", () => {
    const html = ssr(
      createElement(
        List,
        null,
        createElement(List.Item, { title: "Hi", extra: "x" }, createElement("span", null, "body")),
      ),
    );
    expect(html.indexOf("list-meta")).toBeLessThan(html.indexOf("body"));
    expect(html.indexOf("body")).toBeLessThan(html.indexOf("list-extra"));
  });

  test("bordered / split / size become data attributes, split is on by default", () => {
    const base = ssr(createElement(List, { items: [{ key: "a", title: "A" }] }));
    expect(base).toContain('data-size="md"');
    expect(base).toContain("data-split");
    expect(base).not.toContain("data-bordered");
    const html = ssr(
      createElement(List, {
        bordered: true,
        split: false,
        size: "lg",
        items: [{ key: "a", title: "A" }],
      }),
    );
    expect(html).toContain("data-bordered");
    expect(html).not.toContain("data-split");
    expect(html).toContain('data-size="lg"');
  });

  test("header / footer render before and after the list", () => {
    const html = ssr(
      createElement(List, { header: "Head", footer: "Foot", items: [{ key: "a", title: "A" }] }),
    );
    expect(html.indexOf("list-header")).toBeLessThan(html.indexOf("list-items"));
    expect(html.indexOf("list-items")).toBeLessThan(html.indexOf("list-footer"));
  });

  test("no items: shows the empty state (Empty for a string, a node as is), no ul", () => {
    const html = ssr(createElement(List, { items: [] }));
    expect(html).toContain('data-slot="list-empty"');
    expect(html).toContain("No data");
    expect(html).not.toContain("list-items");
    expect(
      ssr(createElement(List, { items: [], empty: createElement("b", null, "Nothing") })),
    ).toContain("<b>Nothing</b>");
  });

  test("loading: aria-busy, a spinner with role=status covers the list", () => {
    const html = ssr(createElement(List, { loading: true, items: [{ key: "a", title: "A" }] }));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("data-loading");
    expect(html).toMatch(/data-slot="list-loading"[^>]*>[\s\S]*role="status"/);
    expect(ssr(createElement(List, { items: [{ key: "a", title: "A" }] }))).not.toContain(
      "aria-busy",
    );
  });
});

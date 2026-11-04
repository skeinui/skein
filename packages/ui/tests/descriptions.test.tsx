import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Descriptions } from "../src/index.ts";
import type { DescriptionsItem } from "../src/index.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);
const item = (label: string, span?: number): DescriptionsItem => ({
  label,
  value: `v-${label}`,
  span,
});
const spansOf = (html: string) =>
  [...html.matchAll(/data-slot="descriptions-item" data-span="(\d+)"/g)].map((m) => Number(m[1]));

describe("Descriptions", () => {
  test("structure: each item in the dl is dt + dd, no class / style", () => {
    const html = ssr(
      createElement(Descriptions, { items: [item("A"), item("B")], title: "Info", extra: "Edit" }),
    );
    expect(html).toContain("<dl");
    expect(html.match(/<dt/g)).toHaveLength(2);
    expect(html.match(/<dd/g)).toHaveLength(2);
    expect(html).toContain('data-slot="descriptions-title">Info<');
    expect(html).toContain('data-slot="descriptions-extra">Edit<');
    expect(html).toContain("v-A");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("no title row without title and extra; extra alone still gets one", () => {
    expect(ssr(createElement(Descriptions, { items: [item("A")] }))).not.toContain(
      "descriptions-header",
    );
    expect(ssr(createElement(Descriptions, { items: [item("A")], extra: "x" }))).toContain(
      "descriptions-header",
    );
  });

  test("filling a row: the last item spans the remaining columns", () => {
    // 3 columns, 5 items: the second row has only two items, the last item spans 2 columns
    expect(
      spansOf(
        ssr(createElement(Descriptions, { items: ["a", "b", "c", "d", "e"].map((l) => item(l)) })),
      ),
    ).toEqual([1, 1, 1, 1, 2]);
    expect(
      spansOf(
        ssr(createElement(Descriptions, { items: ["a", "b", "c", "d"].map((l) => item(l)) })),
      ),
    ).toEqual([1, 1, 1, 3]);
    expect(
      spansOf(ssr(createElement(Descriptions, { items: ["a", "b", "c"].map((l) => item(l)) }))),
    ).toEqual([1, 1, 1]);
  });

  test("span: wraps when it does not fit, the previous item fills its row; a span above the column count is clamped to it", () => {
    const html = ssr(
      createElement(Descriptions, { column: 3, items: [item("a", 2), item("b", 2)] }),
    );
    expect(spansOf(html)).toEqual([3, 3]);
    expect(
      spansOf(
        ssr(
          createElement(Descriptions, {
            column: 3,
            items: [item("a", 1), item("b", 2), item("c", 3)],
          }),
        ),
      ),
    ).toEqual([1, 2, 3]);
    expect(spansOf(ssr(createElement(Descriptions, { column: 2, items: [item("a", 9)] })))).toEqual(
      [2],
    );
    expect(
      spansOf(
        ssr(
          createElement(Descriptions, {
            column: 4,
            items: [item("a", 1), item("b", 3), item("c", 1), item("d", 1)],
          }),
        ),
      ),
    ).toEqual([1, 3, 1, 3]);
  });

  test("column clamped to 1-8, default 3; the spans of each row add up to the column count", () => {
    expect(ssr(createElement(Descriptions, { items: [item("a")] }))).toContain('data-column="3"');
    expect(ssr(createElement(Descriptions, { items: [item("a")], column: 0 }))).toContain(
      'data-column="1"',
    );
    expect(ssr(createElement(Descriptions, { items: [item("a")], column: 99 }))).toContain(
      'data-column="8"',
    );
    // Random combinations: each row sums to the number of columns
    for (let column = 1; column <= 6; column++) {
      for (let n = 1; n <= 9; n++) {
        const items = Array.from({ length: n }, (_, i) =>
          item(String(i), ((i * 7 + column) % 4) + 1),
        );
        const spans = spansOf(ssr(createElement(Descriptions, { items, column })));
        let sum = 0;
        for (const s of spans) {
          sum += s;
          expect(sum, `column ${column} n ${n} spans ${spans.join(",")}`).toBeLessThanOrEqual(
            column,
          );
          if (sum === column) sum = 0;
        }
        expect(sum, `column ${column} n ${n} spans ${spans.join(",")}`).toBe(0);
      }
    }
  });

  test("bordered / layout / size / colon on the root: no colon when bordered or vertical, or with colon=false", () => {
    const plain = ssr(createElement(Descriptions, { items: [item("a")] }));
    expect(plain).toContain('data-layout="horizontal"');
    expect(plain).toContain('data-size="md"');
    expect(plain).toContain("data-colon");
    expect(plain).not.toContain("data-bordered");
    expect(ssr(createElement(Descriptions, { items: [item("a")], bordered: true }))).not.toContain(
      "data-colon",
    );
    expect(
      ssr(createElement(Descriptions, { items: [item("a")], layout: "vertical" })),
    ).not.toContain("data-colon");
    expect(ssr(createElement(Descriptions, { items: [item("a")], colon: false }))).not.toContain(
      "data-colon",
    );
    const sm = ssr(createElement(Descriptions, { items: [item("a")], bordered: true, size: "sm" }));
    expect(sm).toContain("data-bordered");
    expect(sm).toContain('data-size="sm"');
  });

  test("an empty list does not throw", () => {
    expect(() => ssr(createElement(Descriptions, { items: [] }))).not.toThrow();
  });
});

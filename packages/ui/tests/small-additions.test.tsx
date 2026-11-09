import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import {
  Avatar,
  DataTable,
  Paragraph,
  SearchInput,
  Segmented,
  Text,
  formatRelativeTime,
} from "../src/index.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("small additions", () => {
  test("Text / Paragraph `size`: written when not the default", () => {
    expect(ssr(createElement(Text, { size: "xs" }, "a"))).toContain('data-size="xs"');
    expect(ssr(createElement(Paragraph, { size: "lg" }, "a"))).toContain('data-size="lg"');
    expect(ssr(createElement(Text, { size: "md" }, "a"))).not.toContain("data-size");
    expect(ssr(createElement(Text, {}, "a"))).not.toContain("data-size");
  });

  test("SearchInput `width`; fullWidth is separate", () => {
    const html = ssr(createElement(SearchInput, { width: "md" }));
    expect(html).toContain('data-slot="input-group"');
    expect(html).toContain('data-width="md"');
    expect(html).not.toContain("class=");
  });

  test("Segmented `scrollable`", () => {
    const html = ssr(createElement(Segmented, { options: ["a", "b"], scrollable: true }));
    expect(html).toContain("data-scrollable");
    expect(ssr(createElement(Segmented, { options: ["a", "b"] }))).not.toContain("data-scrollable");
  });

  test("Avatar `xs`", () => {
    expect(ssr(createElement(Avatar, { size: "xs", fallback: "A" }))).toContain('data-size="xs"');
  });

  test("DataTable column `minWidth` marks the header", () => {
    const html = ssr(
      createElement(DataTable<{ id: number; title: string }>, {
        rowKey: "id",
        rows: [{ id: 1, title: "x" }],
        columns: [{ key: "title", title: "Title", minWidth: 160 }],
      }),
    );
    expect(html).toContain('data-min-width="160"');
  });

  test("RelativeTime `hoursUntil`: hours are counted in hours up to that many", () => {
    const now = Date.UTC(2026, 10, 9, 12);
    const at = (hours: number) => now - hours * 3600_000;
    const f = (hours: number, hoursUntil?: number) =>
      formatRelativeTime(at(hours), { now, locale: "en", numeric: "always", hoursUntil });
    expect(f(30)).toBe("1 day ago");
    expect(f(30, 48)).toBe("30 hours ago");
    expect(f(50, 48)).toBe("2 days ago");
  });
});

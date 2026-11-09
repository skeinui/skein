// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  Container,
  Flex,
  Grid,
  Paragraph,
  Text,
  Title,
  Typography,
  copyToClipboard,
} from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}
const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });

describe("Flex", () => {
  test("defaults are written as data-*, no class / style", () => {
    const html = ssr(createElement(Flex, null, "x"));
    expect(html).toContain('data-slot="flex"');
    expect(html).toContain('data-direction="row"');
    expect(html).toContain('data-gap="md"');
    expect(html).toContain('data-align="stretch"');
    expect(html).toContain('data-justify="start"');
    expect(html).not.toContain("data-wrap");
    expect(html).not.toContain("data-inline");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("direction / gap / align / justify / wrap / inline / as", () => {
    const html = ssr(
      createElement(Flex, {
        as: "nav",
        direction: "column",
        gap: "xl",
        align: "center",
        justify: "between",
        wrap: true,
        inline: true,
      }),
    );
    expect(html.startsWith("<nav")).toBe(true);
    expect(html).toContain('data-direction="column"');
    expect(html).toContain('data-gap="xl"');
    expect(html).toContain('data-align="center"');
    expect(html).toContain('data-justify="between"');
    expect(html).toContain("data-wrap");
    expect(html).toContain("data-inline");
  });

  test("`grow` is a data attribute, off by default", () => {
    expect(ssr(createElement(Flex, null, "x"))).not.toContain("data-grow");
    expect(ssr(createElement(Flex, { grow: true }, "x"))).toContain("data-grow");
  });

  test("Flex.Spacer is decorative (aria-hidden); other props pass through", () => {
    const html = ssr(
      createElement(Flex, { "aria-label": "bar", id: "f" }, createElement(Flex.Spacer)),
    );
    expect(html).toContain('aria-label="bar"');
    expect(html).toContain('id="f"');
    expect(html).toContain('data-slot="flex-spacer" aria-hidden="true"');
  });
});

describe("Grid", () => {
  test("columns are clamped to 1–12, default 1; no columns with minColumnWidth", () => {
    expect(ssr(createElement(Grid, null))).toContain('data-columns="1"');
    expect(ssr(createElement(Grid, { columns: 4 }))).toContain('data-columns="4"');
    expect(ssr(createElement(Grid, { columns: 0 }))).toContain('data-columns="1"');
    expect(ssr(createElement(Grid, { columns: 99 }))).toContain('data-columns="12"');
    const auto = ssr(createElement(Grid, { minColumnWidth: "md", columns: 3 }));
    expect(auto).toContain('data-min-column="md"');
    expect(auto).not.toContain("data-columns");
  });

  test("Grid.Item span is clamped to 1–12", () => {
    expect(ssr(createElement(Grid.Item, { span: 3 }))).toContain('data-span="3"');
    expect(ssr(createElement(Grid.Item, { span: 0 }))).toContain('data-span="1"');
    expect(ssr(createElement(Grid.Item, { span: 50 }))).toContain('data-span="12"');
    expect(ssr(createElement(Grid.Item, null))).toContain('data-span="1"');
  });
});

describe("Container", () => {
  test("lg, centered and padded by default; each can be turned off", () => {
    const html = ssr(createElement(Container, null));
    expect(html).toContain('data-size="lg"');
    expect(html).toContain("data-center");
    expect(html).toContain("data-padded");
    const off = ssr(
      createElement(Container, { size: "full", center: false, padded: false, as: "main" }),
    );
    expect(off.startsWith("<main")).toBe(true);
    expect(off).toContain('data-size="full"');
    expect(off).not.toContain("data-center");
    expect(off).not.toContain("data-padded");
  });
});

describe("Typography components", () => {
  test("Title renders the matching h1–h5; Paragraph is a p; Text is a span", () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const html = ssr(createElement(Title, { level }, "T"));
      expect(html.startsWith(`<h${level}`)).toBe(true);
      expect(html).toContain(`data-level="${level}"`);
    }
    expect(ssr(createElement(Title, null, "T")).startsWith("<h1")).toBe(true);
    expect(ssr(createElement(Paragraph, null, "P")).startsWith("<p")).toBe(true);
    expect(ssr(createElement(Text, null, "S")).startsWith("<span")).toBe(true);
  });

  test("tone / disabled become data-*; decorations use semantic elements in a fixed nesting order", () => {
    const html = ssr(
      createElement(
        Text,
        {
          tone: "danger",
          disabled: true,
          strong: true,
          italic: true,
          underline: true,
          strikethrough: true,
          code: true,
          mark: true,
        },
        "x",
      ),
    );
    expect(html).toContain('data-tone="danger"');
    expect(html).toContain("data-disabled");
    expect(html).toContain(
      "<strong><em><del><u><mark><code>x</code></mark></u></del></em></strong>",
    );
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
    expect(ssr(createElement(Text, null, "plain"))).not.toContain("<strong");
  });

  test("ellipsis: true is one line, line count clamped to 1–10, no related attributes when off", () => {
    expect(ssr(createElement(Text, { ellipsis: true }, "x"))).toContain('data-rows="1"');
    expect(ssr(createElement(Paragraph, { ellipsis: { rows: 3 } }, "x"))).toContain(
      'data-rows="3"',
    );
    expect(ssr(createElement(Paragraph, { ellipsis: { rows: 99 } }, "x"))).toContain(
      'data-rows="10"',
    );
    expect(ssr(createElement(Paragraph, { ellipsis: { rows: 0 } }, "x"))).toContain(
      'data-rows="1"',
    );
    const plain = ssr(createElement(Paragraph, null, "x"));
    expect(plain).not.toContain("data-ellipsis");
    expect(plain).not.toContain("data-rows");
  });

  test("expandable: an expand button appears when truncated and turns into collapse when clicked; none when not truncated", async () => {
    const expanded: boolean[] = [];
    // jsdom has no layout: use scrollHeight / clientHeight to control "whether it is truncated"
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);
    await mount(
      createElement(
        Paragraph,
        { ellipsis: { rows: 2, expandable: true, onExpand: (e) => expanded.push(e) } },
        "long text",
      ),
    );
    const para = document.querySelector('[data-slot="paragraph"]')!;
    expect(para.hasAttribute("data-truncated")).toBe(true);
    const button = document.querySelector('[data-slot="text-expand"]')!;
    expect(button.textContent).toBe("Expand");
    await click(button);
    expect(expanded).toEqual([true]);
    expect(para.hasAttribute("data-expanded")).toBe(true);
    expect(document.querySelector('[data-slot="text-expand"]')!.textContent).toBe("Collapse");
    expect(para.hasAttribute("data-truncated")).toBe(false);
    await click(document.querySelector('[data-slot="text-expand"]')!);
    expect(expanded).toEqual([true, false]);
  });

  test("not truncated: no expand button, no title", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(50);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    await mount(createElement(Text, { ellipsis: { expandable: true } }, "short"));
    expect(document.querySelector('[data-slot="text-expand"]')).toBeNull();
    expect(document.querySelector('[data-slot="text-content"]')!.hasAttribute("title")).toBe(false);
  });

  test("a truncated single line with string content gets a title with the full text", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    await mount(createElement(Text, { ellipsis: true }, "a very long single line"));
    expect(document.querySelector('[data-slot="text-content"]')!.getAttribute("title")).toBe(
      "a very long single line",
    );
  });

  test("copy: the button copies the shown text, calls onCopy and shows Copied for about 2 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (t: string) => (written.push(t), Promise.resolve()) },
    });
    const copiedTexts: string[] = [];
    await mount(
      createElement(Text, { copyable: { onCopy: (t) => copiedTexts.push(t) } }, "secret-token"),
    );
    const button = document.querySelector<HTMLElement>('[data-slot="text-copy"]')!;
    expect(button.getAttribute("aria-label")).toBe("Copy");
    await click(button);
    expect(written).toEqual(["secret-token"]);
    expect(copiedTexts).toEqual(["secret-token"]);
    expect(button.hasAttribute("data-copied")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Copied");
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(button.hasAttribute("data-copied")).toBe(false);
    vi.useRealTimers();
  });

  test("copy: copyable.text wins; non-string children copy the shown text; labels switch language", async () => {
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (t: string) => (written.push(t), Promise.resolve()) },
    });
    await mount(
      createElement(
        Paragraph,
        { copyable: { text: "custom" }, labels: { copy: "Copy text" } },
        "shown",
      ),
    );
    expect(document.querySelector('[data-slot="text-copy"]')!.getAttribute("aria-label")).toBe(
      "Copy text",
    );
    await click(document.querySelector('[data-slot="text-copy"]')!);
    expect(written).toEqual(["custom"]);
    await act(async () => root!.unmount());
    host!.remove();
    await mount(
      createElement(Text, { copyable: true }, createElement("b", null, "bold"), " and more"),
    );
    await click(document.querySelector('[data-slot="text-copy"]')!);
    expect(written.at(-1)).toBe("bold and more");
  });

  test("Typography container: div / article / section", () => {
    expect(ssr(createElement(Typography, null, "x"))).toContain('<div data-slot="typography"');
    expect(ssr(createElement(Typography, { as: "article" }, "x")).startsWith("<article")).toBe(
      true,
    );
  });
});

describe("copyToClipboard", () => {
  test("falls back to execCommand without the Clipboard API; returns false when both fail", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    let executed = 0;
    document.execCommand = ((cmd: string) => {
      executed++;
      return cmd === "copy";
    }) as typeof document.execCommand;
    expect(await copyToClipboard("hello")).toBe(true);
    expect(executed).toBe(1);
    expect(document.querySelector("textarea")).toBeNull(); // removed after use
    document.execCommand = (() => false) as typeof document.execCommand;
    expect(await copyToClipboard("x")).toBe(false);
  });
});

// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Quote, QuoteSelection } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

// jsdom has no Range geometry methods
if (!("getBoundingClientRect" in Range.prototype))
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    value: () => new DOMRect(40, 20, 60, 16),
  });

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  document.getSelection()?.removeAllRanges();
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(el));
  return host;
}
async function select(node: Node, start: number, end: number) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const sel = document.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  await act(async () => {
    document.dispatchEvent(new Event("selectionchange"));
  });
}
const action = () => host!.querySelector<HTMLButtonElement>('[data-slot="quote-selection-action"]');

describe("<Quote />", () => {
  test("SSR has no class / style; a blockquote with its source", () => {
    const html = ssr(createElement(Quote, { source: "Assistant", children: "hello" }));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain("<blockquote");
    expect(html).toContain("Assistant");
    expect(html).not.toContain("<button");
  });

  test("a remove button only with onRemove, named, calls it on click", async () => {
    const onRemove = vi.fn();
    await mount(
      createElement(Quote, { onRemove, labels: { remove: "Drop quote" }, children: "x" }),
    );
    const btn = host!.querySelector<HTMLButtonElement>("button")!;
    expect(btn.getAttribute("aria-label")).toBe("Drop quote");
    await act(async () => btn.click());
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("<QuoteSelection />", () => {
  const view = (onQuote = vi.fn()) =>
    createElement(
      "div",
      null,
      createElement(QuoteSelection, {
        onQuote,
        children: createElement("p", { id: "in" }, "Hello brave new world"),
      }),
      createElement("p", { id: "out" }, "Outside text"),
    );

  test("no button without a selection; selecting text inside shows it, positioned by CSS variables", async () => {
    await mount(view());
    expect(action()).toBeNull();
    await select(host!.querySelector("#in")!.firstChild!, 6, 11);
    expect(action()?.textContent).toBe("Quote");
    const box = host!.querySelector<HTMLElement>('[data-slot="quote-selection"]')!;
    expect(box.style.getPropertyValue("--quote-x")).not.toBe("");
    expect(box.style.getPropertyValue("--quote-y")).not.toBe("");
  });

  test("clicking passes the selected text to onQuote, clears the selection and hides the button", async () => {
    const onQuote = vi.fn();
    await mount(view(onQuote));
    await select(host!.querySelector("#in")!.firstChild!, 6, 11);
    await act(async () => action()!.click());
    expect(onQuote).toHaveBeenCalledWith("brave");
    expect(document.getSelection()!.isCollapsed).toBe(true);
    expect(action()).toBeNull();
  });

  test("a selection outside or a cleared one hides the button; pressing the button keeps the selection", async () => {
    await mount(view());
    await select(host!.querySelector("#in")!.firstChild!, 0, 5);
    expect(action()).not.toBeNull();
    const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    action()!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    await select(host!.querySelector("#out")!.firstChild!, 0, 7);
    expect(action()).toBeNull();
    await select(host!.querySelector("#in")!.firstChild!, 0, 5);
    await act(async () => {
      document.getSelection()!.removeAllRanges();
      document.dispatchEvent(new Event("selectionchange"));
    });
    expect(action()).toBeNull();
  });

  test("no button for a whitespace-only selection; the button follows the content (Tab order); labels apply", async () => {
    await mount(
      createElement(QuoteSelection, {
        onQuote: () => {},
        labels: { quote: "Cite" },
        children: createElement("p", { id: "in" }, "a   b"),
      }),
    );
    await select(host!.querySelector("#in")!.firstChild!, 1, 4);
    expect(action()).toBeNull();
    await select(host!.querySelector("#in")!.firstChild!, 0, 1);
    expect(action()?.textContent).toBe("Cite");
    expect(action()!.previousElementSibling?.id).toBe("in");
  });
});

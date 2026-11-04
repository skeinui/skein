// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { FloatButton } from "../src/index.ts";

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
  vi.unstubAllGlobals();
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
const icon = createElement("i", null, "I");

describe("FloatButton", () => {
  test("SSR: defaults to a round default button in the bottom-right corner; icon aria-hidden; no class / style", () => {
    const html = ssr(createElement(FloatButton, { icon, "aria-label": "Help" }));
    expect(html).toMatch(/^<button type="button"/);
    expect(html).toContain('data-shape="circle"');
    expect(html).toContain('data-variant="default"');
    expect(html).toContain('data-corner="bottom-end"');
    expect(html).toContain('aria-label="Help"');
    expect(html).toContain('data-slot="floatbutton-icon" aria-hidden="true"');
    expect(html).not.toMatch(/class=|style=/);
  });

  test("shape / variant / corner written as data attributes; label only shown when square", () => {
    const sq = ssr(
      createElement(FloatButton, {
        icon,
        label: "Chat",
        shape: "square",
        variant: "primary",
        corner: "top-start",
      }),
    );
    expect(sq).toContain('data-shape="square"');
    expect(sq).toContain('data-variant="primary"');
    expect(sq).toContain('data-corner="top-start"');
    expect(sq).toContain("data-has-label");
    expect(sq).toContain("Chat");
    const circle = ssr(createElement(FloatButton, { icon, label: "Chat", "aria-label": "Chat" }));
    expect(circle).not.toContain('data-slot="floatbutton-label"');
  });

  test("href renders a link", () => {
    const html = ssr(createElement(FloatButton, { icon, href: "/help", "aria-label": "Help" }));
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/help"');
  });

  test("Group: role=group, its buttons are no longer each fixed to a corner, Group sets the shape", () => {
    const html = ssr(
      createElement(
        FloatButton.Group,
        { shape: "square", corner: "bottom-start", "aria-label": "Tools" },
        createElement(FloatButton, { icon, "aria-label": "A" }),
        createElement(FloatButton, { icon, "aria-label": "B", shape: "circle" }),
      ),
    );
    expect(html).toMatch(/<div role="group"[^>]*data-slot="floatbutton-group"/);
    expect(html).toContain('data-corner="bottom-start"');
    expect(html).toContain("data-in-group");
    expect(html).not.toMatch(/data-slot="floatbutton"[^>]*data-corner/);
    expect(html.match(/data-shape="square"/g)!.length).toBe(2); // group + the first button; the second sets circle itself
  });

  test("click callback; wrapping in a tooltip does not change the button itself", async () => {
    const onClick = vi.fn();
    const el = await mount(
      createElement(FloatButton, { icon, "aria-label": "Add", onClick, tooltip: "Add item" }),
    );
    await act(async () => {
      el.querySelector<HTMLElement>("[data-slot=floatbutton]")!.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("FloatButton.BackTop", () => {
  const setScroll = (n: number) => {
    Object.defineProperty(window, "scrollY", { value: n, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  };

  test("hidden until scrolled past visibilityHeight, shown beyond it, hidden again when back", async () => {
    setScroll(0);
    const el = await mount(createElement(FloatButton.BackTop, { visibilityHeight: 200 }));
    expect(el.querySelector("[data-slot=floatbutton]")).toBeNull();
    await act(async () => setScroll(250));
    expect(el.querySelector("[data-slot=floatbutton]")).not.toBeNull();
    await act(async () => setScroll(50));
    expect(el.querySelector("[data-slot=floatbutton]")).toBeNull();
  });

  test("default name Back to top; click scrolls to the top (not smooth with reduced motion), onClick is called too", async () => {
    setScroll(500);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    window.scrollTo = scrollTo as typeof window.scrollTo;
    const onClick = vi.fn();
    const el = await mount(createElement(FloatButton.BackTop, { onClick }));
    const btn = el.querySelector<HTMLElement>("[data-slot=floatbutton]")!;
    expect(btn.getAttribute("aria-label")).toBe("Back to top");
    await act(async () => btn.click());
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: expect.stringMatching(/smooth|auto/),
    });
    expect(onClick).toHaveBeenCalled();
  });

  test("target: listens to and scrolls the given scroll container", async () => {
    const box = document.createElement("div");
    document.body.appendChild(box);
    const scrollTo = vi.fn();
    box.scrollTo = scrollTo as typeof box.scrollTo;
    Object.defineProperty(box, "scrollTop", { value: 0, writable: true, configurable: true });
    const el = await mount(
      createElement(FloatButton.BackTop, { target: () => box, visibilityHeight: 100 }),
    );
    expect(el.querySelector("[data-slot=floatbutton]")).toBeNull();
    await act(async () => {
      box.scrollTop = 300;
      box.dispatchEvent(new Event("scroll"));
    });
    await act(async () => el.querySelector<HTMLElement>("[data-slot=floatbutton]")!.click());
    expect(scrollTo).toHaveBeenCalled();
    box.remove();
  });
});

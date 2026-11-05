// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Calendar, Carousel, ConfigProvider, Pagination } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.unstubAllGlobals();
  for (const k of ["skeinTheme", "skeinMode", "skeinColor", "skeinDensity"])
    delete document.documentElement.dataset[k];
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const html = () => document.documentElement.dataset;

describe("ConfigProvider", () => {
  test("writes themeStyle / mode / themeColor to <html>, updates on change, restores on unmount", async () => {
    document.documentElement.dataset.skeinTheme = "default";
    await mount(
      createElement(ConfigProvider, {
        themeStyle: "antd",
        mode: "dark",
        themeColor: ["purple", "contrast"],
      }),
    );
    expect(html().skeinTheme).toBe("antd");
    expect(html().skeinMode).toBe("dark");
    expect(html().skeinColor).toBe("purple contrast");
    await act(async () => {
      root!.render(createElement(ConfigProvider, { themeStyle: "heroui", mode: "light" }));
    });
    expect(html().skeinTheme).toBe("heroui");
    expect(html().skeinMode).toBe("light");
    expect(html().skeinColor).toBeUndefined();
    await act(async () => root!.unmount());
    root = null;
    expect(html().skeinTheme).toBe("default");
    expect(html().skeinMode).toBeUndefined();
  });

  test("themeOverrides: the three radii / density / colors go to inline variables on <html>, update on change, restore on unmount", async () => {
    const root_ = document.documentElement;
    root_.style.setProperty("--ui-radius", "2px");
    await mount(
      createElement(ConfigProvider, {
        mode: "light",
        themeOverrides: {
          radiusSm: 0.25,
          radius: 0.5,
          radiusLg: 1,
          density: 0.9,
          colors: { primary: "#7c3aed" },
        },
      }),
    );
    expect(root_.style.getPropertyValue("--ui-radius-sm")).toBe("0.25rem");
    expect(root_.style.getPropertyValue("--ui-radius-md")).toBe("0.5rem");
    expect(root_.style.getPropertyValue("--ui-radius-lg")).toBe("1rem");
    expect(root_.style.getPropertyValue("--ui-r-block")).toBe("1rem");
    expect(root_.style.getPropertyValue("--ui-density")).toBe("0.9");
    expect(root_.style.getPropertyValue("--ui-c-primary")).toBe("#7c3aed");
    await act(async () => {
      root!.render(createElement(ConfigProvider, { mode: "light", themeOverrides: { radius: 1 } }));
    });
    expect(root_.style.getPropertyValue("--ui-radius-md")).toBe("1rem");
    expect(root_.style.getPropertyValue("--ui-c-primary")).toBe("");
    await act(async () => root!.unmount());
    root = null;
    expect(root_.style.getPropertyValue("--ui-radius-md")).toBe("");
    expect(root_.style.getPropertyValue("--ui-radius")).toBe("2px");
    root_.style.removeProperty("--ui-radius");
  });

  test("props not given are left alone", async () => {
    document.documentElement.dataset.skeinMode = "dark";
    await mount(createElement(ConfigProvider, { themeStyle: "antd" }));
    expect(html().skeinMode).toBe("dark");
  });

  test("mode=system follows the system and updates when it changes", async () => {
    let listener: (() => void) | null = null;
    const mq = {
      matches: true,
      addEventListener: (_: string, fn: () => void) => (listener = fn),
      removeEventListener: () => (listener = null),
    };
    vi.stubGlobal("matchMedia", () => mq);
    await mount(createElement(ConfigProvider, { mode: "system" }));
    expect(html().skeinMode).toBe("dark");
    mq.matches = false;
    await act(async () => listener?.());
    expect(html().skeinMode).toBe("light");
  });

  test("labels reach Pagination / Carousel, a component's own labels win; SSR does not throw and has no class / style", async () => {
    const labels = { pagination: { next: "Forward page" }, carousel: { next: "Forward slide" } };
    const out = renderToStaticMarkup(
      createElement(
        ConfigProvider,
        { labels },
        createElement(Pagination, { total: 50, pageSize: 10, page: 1, onPageChange: () => {} }),
        createElement(Carousel, {
          "aria-label": "x",
          children: [createElement("i", { key: 1 }), createElement("i", { key: 2 })],
        }),
      ),
    );
    expect(out).toContain('aria-label="Forward page"');
    expect(out).toContain('aria-label="Forward slide"');
    expect(out).not.toMatch(/class=|style=/);
    const own = renderToStaticMarkup(
      createElement(
        ConfigProvider,
        { labels },
        createElement(Pagination, {
          total: 50,
          pageSize: 10,
          page: 1,
          onPageChange: () => {},
          labels: { next: "Next!" },
        }),
      ),
    );
    expect(own).toContain('aria-label="Next!"');
  });

  test("locale is Calendar's default, Calendar's own locale wins", () => {
    const month = "2026-03";
    const zh = renderToStaticMarkup(
      createElement(
        ConfigProvider,
        { locale: "zh-CN" },
        createElement(Calendar, { defaultMonth: month }),
      ),
    );
    const en = renderToStaticMarkup(
      createElement(
        ConfigProvider,
        { locale: "zh-CN" },
        createElement(Calendar, { defaultMonth: month, locale: "en-US" }),
      ),
    );
    expect(zh).toMatch(/2026年3月/);
    expect(en).toContain("March 2026");
  });
});

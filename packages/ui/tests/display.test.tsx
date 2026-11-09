// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  Avatar,
  Badge,
  Card,
  Progress,
  Separator,
  Spinner,
  Tabs,
  Toaster,
  toast,
} from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ssr = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("display components (SSR)", () => {
  test("Badge hangs a count on its child: danger / md / top-end, no styles", () => {
    const html = ssr(createElement(Badge, { count: 5 }, createElement("i", null, "bell")));
    expect(html).toContain('data-slot="badge"');
    expect(html).toContain('data-color="danger"');
    expect(html).toContain('data-size="md"');
    expect(html).toContain('data-placement="top-end"');
    expect(html).toContain("data-wrapped");
    expect(html).toContain('data-slot="badge-indicator"');
    expect(html).toContain(">5</span>");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("Badge caps the number at max and hides 0 unless showZero", () => {
    expect(ssr(createElement(Badge, { count: 120 }))).toContain(">99+</span>");
    expect(ssr(createElement(Badge, { count: 12, max: 9 }))).toContain(">9+</span>");
    expect(ssr(createElement(Badge, { count: 0 }))).not.toContain("badge-indicator");
    expect(ssr(createElement(Badge, { count: 0, showZero: true }))).toContain(">0</span>");
    expect(ssr(createElement(Badge, { count: -1 }))).not.toContain("badge-indicator");
    expect(ssr(createElement(Badge, null))).not.toContain("badge-indicator");
    expect(ssr(createElement(Badge, { count: "new" }))).toContain(">new</span>");
  });

  test("Badge dot has no text, and standalone it has no placement", () => {
    const html = ssr(createElement(Badge, { dot: true, count: 5 }));
    expect(html).toContain("data-dot");
    expect(html).not.toContain(">5<");
    expect(html).not.toContain("data-placement");
    expect(html).not.toContain("data-wrapped");
  });

  test("each Card part has its own slot", () => {
    const html = ssr(
      createElement(
        Card,
        { variant: "elevated" },
        createElement(Card.Header, null, createElement(Card.Title, null, "t")),
        createElement(Card.Body, null, "b"),
        createElement(Card.Footer, null, "f"),
      ),
    );
    for (const slot of ["card", "card-header", "card-title", "card-body", "card-footer"]) {
      expect(html).toContain(`data-slot="${slot}"`);
    }
    expect(html).toContain('data-variant="elevated"');
    expect(html).not.toContain("class=");
  });

  test("Card `fill` is a data attribute, off by default", () => {
    expect(ssr(createElement(Card, null, "x"))).not.toContain("data-fill");
    expect(ssr(createElement(Card, { fill: true }, "x"))).toContain("data-fill");
  });

  test("Spinner has role=status and a default accessible name", () => {
    const html = ssr(createElement(Spinner, { size: "lg", color: "danger" }));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading"');
    expect(html).toContain('data-size="lg"');
    expect(html).toContain('data-color="danger"');
  });

  test("Separator is horizontal by default, can be vertical", () => {
    expect(ssr(createElement(Separator))).toContain('data-orientation="horizontal"');
    expect(ssr(createElement(Separator, { orientation: "vertical" }))).toContain(
      'data-orientation="vertical"',
    );
  });

  test("Avatar renders only the fallback without an image", () => {
    const html = ssr(createElement(Avatar, { fallback: "AB", size: "lg" }));
    expect(html).toContain('data-slot="avatar"');
    expect(html).toContain('data-size="lg"');
    expect(html).toContain("AB");
    expect(html).not.toContain('data-slot="avatar-image"');
  });

  test("Tabs put variant / color / size on the root, the list has an indicator", () => {
    const html = ssr(
      createElement(
        Tabs,
        { defaultValue: "a", variant: "solid", fullWidth: true },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { value: "a" }, "A"),
          createElement(Tabs.Tab, { value: "b" }, "B"),
        ),
        createElement(Tabs.Panel, { value: "a" }, "Content"),
      ),
    );
    expect(html).toContain('data-variant="solid"');
    expect(html).toContain('data-color="primary"');
    expect(html).toContain("data-full-width");
    expect(html).toContain('data-slot="tabs-indicator"');
    expect(html).toContain('data-slot="tabs-panel"');
    expect(html).not.toContain("class=");
  });
});

describe("Tabs interaction (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
  });

  test("clicking a tab switches the selected tab and panel", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => {
      root.render(
        createElement(
          Tabs,
          { defaultValue: "a" },
          createElement(
            Tabs.List,
            null,
            createElement(Tabs.Tab, { value: "a" }, "A"),
            createElement(Tabs.Tab, { value: "b" }, "B"),
          ),
          createElement(Tabs.Panel, { value: "a" }, "Panel A"),
          createElement(Tabs.Panel, { value: "b" }, "Panel B"),
        ),
      );
    });
    const tabs = el.querySelectorAll('[data-slot="tabs-tab"]');
    expect(tabs[0].hasAttribute("data-active")).toBe(true);
    expect(tabs[1].hasAttribute("data-active")).toBe(false);
    await act(async () => {
      (tabs[1] as HTMLElement).click();
    });
    expect(tabs[1].hasAttribute("data-active")).toBe(true);
    expect(el.querySelector('[data-slot="tabs-panel"]:not([hidden])')?.textContent).toBe("Panel B");
  });
});

describe("Progress / Toast", () => {
  test("Progress writes role and data hooks, null means indeterminate", () => {
    const html = ssr(createElement(Progress, { value: 40, label: "Upload", showValue: true }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('data-slot="progress-track"');
    expect(html).toContain('data-slot="progress-indicator"');
    expect(html).toContain('data-slot="progress-label"');
    expect(html).toContain("data-progressing");
    expect(ssr(createElement(Progress, { value: null }))).toContain("data-indeterminate");
  });

  test("with Toaster rendered, toast.success shows a typed message", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => {
      root.render(createElement(Toaster, { position: "top-center" }));
    });
    await act(async () => {
      toast.success("Saved", { description: "Your changes are live" });
    });
    const item = document.body.querySelector('[data-slot="toast"]');
    expect(item?.getAttribute("data-type")).toBe("success");
    expect(document.body.querySelector('[data-slot="toast-title"]')?.textContent).toBe("Saved");
    expect(
      document.body.querySelector('[data-slot="toast-viewport"]')?.getAttribute("data-position"),
    ).toBe("top-center");
    expect(document.body.querySelector('[data-slot="toast-icon"]')).not.toBeNull();
    expect(
      document.body.querySelector('[data-slot="toast-viewport"]')?.getAttribute("data-layout"),
    ).toBe("list");
    await act(async () => {
      root.render(createElement(Toaster, { layout: "stack" }));
    });
    expect(
      document.body.querySelector('[data-slot="toast-viewport"]')?.getAttribute("data-layout"),
    ).toBe("stack");
    await act(async () => root.unmount());
    el.remove();
  });

  test("richColors: from the Toaster, overridden by a toast's own", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => {
      root.render(createElement(Toaster, { richColors: true }));
    });
    await act(async () => {
      toast.close();
    });
    await act(async () => {
      toast.success("Rich");
      toast.danger("Plain", { richColors: false });
    });
    const byTitle = (title: string) =>
      [...document.body.querySelectorAll('[data-slot="toast"]')].find(
        (t) => t.querySelector('[data-slot="toast-title"]')?.textContent === title,
      );
    expect(byTitle("Rich")?.hasAttribute("data-rich-colors")).toBe(true);
    expect(byTitle("Plain")?.hasAttribute("data-rich-colors")).toBe(false);
    await act(async () => root.unmount());
    el.remove();
  });

  test("closeButton, icons and toast.custom", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    const close = () => document.body.querySelectorAll('[data-slot="toast-close"]').length;
    await act(async () => {
      root.render(
        createElement(Toaster, { icons: { success: createElement("i", { id: "own-icon" }) } }),
      );
    });
    await act(async () => {
      toast.close();
    });
    await act(async () => {
      toast.success("Saved");
    });
    // A close button on every toast, and the Toaster's icon for the type
    expect(close()).toBe(1);
    expect(document.body.querySelector('[data-slot="toast-icon"] #own-icon')).not.toBeNull();
    await act(async () => {
      toast.close();
    });
    await act(async () => {
      root.render(createElement(Toaster, { closeButton: false }));
    });
    await act(async () => {
      toast.info("No close");
      toast({
        title: "Own close",
        closeButton: true,
        icon: createElement("b", { id: "toast-icon" }),
      });
    });
    expect(close()).toBe(1);
    expect(document.body.querySelector('[data-slot="toast-icon"] #toast-icon')).not.toBeNull();
    await act(async () => {
      toast.close();
    });
    await act(async () => {
      toast.custom((id) => createElement("p", { id: "custom" }, id));
    });
    const custom = document.body.querySelector('[data-slot="toast"]');
    expect(custom?.querySelector('[data-slot="toast-content"] #custom')?.textContent).toBeTruthy();
    // Content of its own: no icon, title or action around it
    expect(custom?.querySelector('[data-slot="toast-icon"], [data-slot="toast-title"]')).toBeNull();
    await act(async () => root.unmount());
    el.remove();
  });
});

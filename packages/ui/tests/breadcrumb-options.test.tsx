// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { AdminLayout, Breadcrumb, normalizeSettings, settingsToCode } from "../src/index.ts";
import type { BreadcrumbProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const icon = (id: string) => createElement("i", { id });
const ITEMS: BreadcrumbProps["items"] = [
  { icon: icon("i-home"), label: "Home", href: "/" },
  { icon: icon("i-tenants"), label: "Tenants", href: "/t" },
  { label: "List" },
];

async function render(node: ReturnType<typeof createElement>) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
}
const icons = () =>
  [...document.querySelectorAll('[data-slot="breadcrumb-icon"] > i')].map((e) => e.id);

describe("<Breadcrumb /> icons / separatorStyle", () => {
  test("default all: every item with an icon shows it; items without one have none", async () => {
    await render(createElement(Breadcrumb, { items: ITEMS }));
    expect(icons()).toEqual(["i-home", "i-tenants"]);
    expect(document.querySelector('[data-slot="breadcrumb"]')!.getAttribute("data-icons")).toBe(
      "all",
    );
  });

  test("first keeps only the first item's icon; none shows none", async () => {
    await render(createElement(Breadcrumb, { items: ITEMS, icons: "first" }));
    expect(icons()).toEqual(["i-home"]);
    await act(async () => root!.render(createElement(Breadcrumb, { items: ITEMS, icons: "none" })));
    expect(icons()).toEqual([]);
  });

  test("the icon is inside the link / current page, before the text, hidden from screen readers", async () => {
    await render(createElement(Breadcrumb, { items: [{ icon: icon("a"), label: "A" }] }));
    const page = document.querySelector('[data-slot="breadcrumb-page"]')!;
    expect(page.firstElementChild!.getAttribute("data-slot")).toBe("breadcrumb-icon");
    expect(page.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  test("separatorStyle=slash: the separator is a slash; a custom separator wins", async () => {
    await render(createElement(Breadcrumb, { items: ITEMS, separatorStyle: "slash" }));
    const seps = [...document.querySelectorAll('[data-slot="breadcrumb-separator"]')];
    expect(seps.map((e) => e.textContent)).toEqual(["/", "/"]);
    expect(seps[0]!.getAttribute("data-variant")).toBe("slash");
    await act(async () =>
      root!.render(
        createElement(Breadcrumb, { items: ITEMS, separatorStyle: "slash", separator: ">" }),
      ),
    );
    expect(document.querySelector('[data-slot="breadcrumb-separator"]')!.textContent).toBe(">");
    await act(async () => root!.render(createElement(Breadcrumb, { items: ITEMS })));
    expect(document.querySelector('[data-slot="breadcrumb-separator"] svg')).not.toBeNull();
  });
});

describe("<AdminLayout /> passes the breadcrumb's default look to its Breadcrumb", () => {
  const nav = [{ key: "/a", label: "A" }];
  const layout = (props: Record<string, unknown>) =>
    createElement(AdminLayout, {
      items: nav,
      activeKey: "/a",
      layout: "side",
      toolbar: "header",
      breadcrumb: createElement(Breadcrumb, { items: ITEMS }),
      ...props,
    });

  test("settings.breadcrumbIcons / breadcrumbSeparator take effect", async () => {
    await render(layout({ settings: { breadcrumbIcons: "first", breadcrumbSeparator: "slash" } }));
    expect(icons()).toEqual(["i-home"]);
    expect(document.querySelector('[data-slot="breadcrumb-separator"]')!.textContent).toBe("/");
  });

  test("props win over settings; Breadcrumb's own icons win over both", async () => {
    await render(layout({ settings: { breadcrumbIcons: "none" }, breadcrumbIcons: "all" }));
    expect(icons()).toEqual(["i-home", "i-tenants"]);
    await act(async () =>
      root!.render(
        layout({
          settings: { breadcrumbIcons: "all" },
          breadcrumb: createElement(Breadcrumb, { items: ITEMS, icons: "none" }),
        }),
      ),
    );
    expect(icons()).toEqual([]);
  });

  test("unset means all + chevron", async () => {
    await render(layout({}));
    expect(icons()).toEqual(["i-home", "i-tenants"]);
    expect(document.querySelector('[data-slot="breadcrumb-separator"] svg')).not.toBeNull();
  });
});

describe("breadcrumb options in settings", () => {
  test("normalizeSettings: defaults are not written, invalid values fall back to the default", () => {
    expect(
      normalizeSettings({ breadcrumbIcons: "all", breadcrumbSeparator: "chevron" }),
    ).not.toHaveProperty("breadcrumbIcons");
    const s = normalizeSettings({ breadcrumbIcons: "first", breadcrumbSeparator: "slash" });
    expect(s.breadcrumbIcons).toBe("first");
    expect(s.breadcrumbSeparator).toBe("slash");
    const bad = normalizeSettings({ breadcrumbIcons: "x", breadcrumbSeparator: 3 });
    expect(bad).not.toHaveProperty("breadcrumbIcons");
    expect(bad).not.toHaveProperty("breadcrumbSeparator");
  });

  test("toolbar / showBreadcrumb: defaults are not written; the old layout:'side-header' is read back as side + toolbar:header", () => {
    expect(normalizeSettings({ toolbar: "sidebar", showBreadcrumb: true })).not.toHaveProperty(
      "toolbar",
    );
    expect(normalizeSettings({ toolbar: "sidebar", showBreadcrumb: true })).not.toHaveProperty(
      "showBreadcrumb",
    );
    const s = normalizeSettings({ toolbar: "header", showBreadcrumb: false });
    expect(s.toolbar).toBe("header");
    expect(s.showBreadcrumb).toBe(false);
    expect(normalizeSettings({ toolbar: "nope" })).not.toHaveProperty("toolbar");
    const legacy = normalizeSettings({ layout: "side-header" });
    expect(legacy.layout).toBe("side");
    expect(legacy.toolbar).toBe("header");
    // If an old file also has a toolbar, it takes precedence
    expect(normalizeSettings({ layout: "side-header", toolbar: "sidebar" })).not.toHaveProperty(
      "toolbar",
    );
    const code = settingsToCode({
      ...normalizeSettings({}),
      toolbar: "header",
      showBreadcrumb: false,
    });
    expect(code).toContain('"toolbar": "header"');
    expect(code).toContain('"showBreadcrumb": false');
  });

  test("settingsToCode includes non-default breadcrumb options", () => {
    const code = settingsToCode({
      ...normalizeSettings({}),
      breadcrumbIcons: "none",
      breadcrumbSeparator: "slash",
    });
    expect(code).toContain('"breadcrumbIcons": "none"');
    expect(code).toContain('"breadcrumbSeparator": "slash"');
    expect(settingsToCode(normalizeSettings({}))).not.toContain("breadcrumb");
  });
});

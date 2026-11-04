// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Autocomplete, Fieldset, Menubar, Meter, NavigationMenu, Toolbar } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Fieldset / Meter / Toolbar (SSR)", () => {
  test("Fieldset renders a legend", () => {
    const html = ssr(createElement(Fieldset, { legend: "Account" }, "Content"));
    expect(html).toContain("<fieldset");
    expect(html).toContain('data-slot="fieldset-legend"');
    expect(html).not.toContain("class=");
  });

  test("Meter reuses the progress slots and has role=meter", () => {
    const html = ssr(createElement(Meter, { value: 40, label: "Disk", showValue: true }));
    expect(html).toContain('role="meter"');
    expect(html).toContain('data-slot="progress"');
    expect(html).toContain("data-meter");
    expect(html).toContain('data-slot="progress-track"');
    expect(html).toContain('data-slot="progress-indicator"');
  });

  test("Toolbar buttons reuse the Button look, the separator reuses separator", () => {
    const html = ssr(
      createElement(
        Toolbar,
        null,
        createElement(Toolbar.Button, null, "Bold"),
        createElement(Toolbar.Separator),
        createElement(Toolbar.Group, null, createElement(Toolbar.Button, null, "Left")),
      ),
    );
    expect(html).toContain('data-slot="toolbar"');
    expect(html).toContain('data-slot="toolbar-group"');
    expect(html).toContain('data-slot="button"');
    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain('data-slot="separator"');
    expect(html).toContain('role="toolbar"');
  });
});

describe("Menubar / NavigationMenu / Autocomplete (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
    document.body.innerHTML = "";
  });
  async function mount(node: React.ReactNode) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => root.render(node));
    return el;
  }

  test("Menubar renders top-level triggers; a click opens items with the menu slots", async () => {
    const el = await mount(
      createElement(
        Menubar,
        null,
        createElement(
          Menubar.Menu,
          null,
          createElement(Menubar.Trigger, null, "File"),
          createElement(
            Menubar.Content,
            null,
            createElement(Menubar.Item, null, "New"),
            createElement(Menubar.Separator),
            createElement(Menubar.Item, null, "Quit"),
          ),
        ),
      ),
    );
    expect(el.querySelector('[data-slot="menubar"]')?.getAttribute("role")).toBe("menubar");
    const trigger = el.querySelector('[data-slot="menubar-trigger"]') as HTMLElement;
    expect(trigger.textContent).toBe("File");
    await act(async () => trigger.click());
    expect(document.body.querySelectorAll('[data-slot="menu-item"]').length).toBe(2);
    expect(document.body.querySelector('[data-slot="menu"]')).not.toBeNull();
  });

  test("NavigationMenu renders the list, triggers and links", async () => {
    const el = await mount(
      createElement(
        NavigationMenu,
        null,
        createElement(
          NavigationMenu.List,
          null,
          createElement(
            NavigationMenu.Item,
            null,
            createElement(NavigationMenu.Trigger, null, "Products"),
            createElement(
              NavigationMenu.Content,
              null,
              createElement(NavigationMenu.Link, { href: "#a" }, "A"),
            ),
          ),
          createElement(
            NavigationMenu.Item,
            null,
            createElement(NavigationMenu.Link, { href: "#docs" }, "Docs"),
          ),
        ),
      ),
    );
    expect(el.querySelector('[data-slot="navigation-menu"]')).not.toBeNull();
    expect(el.querySelector('[data-slot="navigation-menu-list"]')).not.toBeNull();
    expect(el.querySelectorAll('[data-slot="navigation-menu-item"]').length).toBe(2);
    expect(el.querySelector('[data-slot="navigation-menu-trigger"]')?.textContent).toBe("Products");
    expect(el.querySelector('[data-slot="navigation-menu-icon"]')).not.toBeNull();
    expect(
      el
        .querySelector('[data-slot="navigation-menu-item"] > [data-slot="navigation-menu-link"]')
        ?.getAttribute("href"),
    ).toBe("#docs");
  });

  test("Autocomplete has text in its input and lists suggestions with the select slots when open", async () => {
    await mount(
      createElement(Autocomplete, {
        items: ["apple", "banana", "cherry"],
        defaultValue: "a",
        open: true,
        "aria-label": "Fruit",
      }),
    );
    expect(
      (document.body.querySelector('[data-slot="input-group-input"]') as HTMLInputElement).value,
    ).toBe("a");
    const items = [...document.body.querySelectorAll('[data-slot="select-item"]')].map(
      (e) => e.textContent,
    );
    expect(items).toContain("apple");
    expect(items).toContain("banana");
    expect(items).not.toContain("cherry");
  });
});

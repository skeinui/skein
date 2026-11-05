// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  ADMIN_LAYOUT_THEME_COLORS,
  AdminLayout,
  AdminLayoutSettings,
  DEFAULT_ADMIN_LAYOUT_SETTINGS,
  serializeSettings,
} from "../src/index.ts";
import type { AdminLayoutSettingsValue } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("style");
});

const q = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const click = (el: Element) =>
  act(async () => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

let latest: AdminLayoutSettingsValue = DEFAULT_ADMIN_LAYOUT_SETTINGS;
function Harness({
  initial = DEFAULT_ADMIN_LAYOUT_SETTINGS,
  sections,
}: {
  initial?: AdminLayoutSettingsValue;
  sections?: ("presets" | "layout" | "colors" | "shape")[];
}) {
  const [value, setValue] = useState(initial);
  latest = value;
  return createElement(AdminLayoutSettings, { value, onValueChange: setValue, sections });
}

async function mount(props: Parameters<typeof Harness>[0] = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement(Harness, props)));
}

describe("<AdminLayoutSettings />", () => {
  test("all four sections by default; sections can pick some", async () => {
    await mount();
    expect(
      [...document.querySelectorAll("[data-section]")].map(
        (e) => (e as HTMLElement).dataset.section,
      ),
    ).toEqual(["presets", "layout", "colors", "shape", "export"]);
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount({ sections: ["colors"] });
    expect(document.querySelectorAll("[data-section]").length).toBe(1);
  });

  test("color themes in the presets section: clicking one swaps all colors; the selected one has aria-checked; default clears colors", async () => {
    await mount();
    const themes = [
      ...document.querySelectorAll(
        '[aria-label="Palette"] [data-slot="admin-layout-settings-preset"]',
      ),
    ];
    expect(themes.length).toBe(ADMIN_LAYOUT_THEME_COLORS.length);
    const ocean = themes.find((b) => b.textContent === "Ocean")!;
    await click(ocean);
    expect(latest.themeOverrides.colors).toEqual({ primary: "#1677ff", sidebar: "#001529" });
    expect(ocean.getAttribute("aria-checked")).toBe("true");
    await click(themes.find((b) => b.textContent === "Style default")!);
    expect(latest.themeOverrides.colors).toBeUndefined();
  });

  test("Semi Dark: three states; disabled with a custom sidebar color", async () => {
    await mount();
    await click(q('[aria-label="Semi dark"] [data-value="on"]')!);
    expect(latest.semiDark).toBe("on");
    await click(q('[aria-label="Semi dark"] [data-value="auto"]')!);
    expect(latest.semiDark).toBeUndefined();
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount({
      initial: {
        ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
        themeOverrides: { colors: { sidebar: "#001529" } },
      },
    });
    expect(q('[aria-label="Semi dark"] [data-value="on"]')!.hasAttribute("disabled")).toBe(true);
    expect(q('[data-section="layout"]')!.textContent).toContain("sidebar color is customized");
  });

  test("layout section: layout / menu style / tabs switch; tab style disabled when tabs are off", async () => {
    await mount();
    await click(q('[aria-label="Layout"] [data-value="top"]')!);
    expect(latest.layout).toBe("top");
    await click(q('[aria-label="Menu style"] [data-value="default"]')!);
    expect(latest.menuVariant).toBe("default");
    await click(q('[role="switch"][aria-label="Page tabs"]')!);
    expect(latest.showTabs).toBe(false);
    expect(
      q('[aria-label="Tab style"] [data-value="card"]')!.hasAttribute("disabled") ||
        q('[aria-label="Tab style"]')!.getAttribute("aria-disabled") === "true" ||
        q('[aria-label="Tab style"] [data-value="card"]')!.getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  test("colors section: shows the theme style default when not customised, a reset button once set, clicking it clears that entry", async () => {
    await mount({
      initial: {
        ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
        themeOverrides: { colors: { primary: "#7c3aed" } },
      },
    });
    expect(
      q('[data-slot="admin-layout-settings-clear"][aria-label="Reset Primary"]'),
    ).not.toBeNull();
    expect(q('[data-slot="admin-layout-settings-clear"][aria-label="Reset Secondary"]')).toBeNull();
    await click(q('[data-slot="admin-layout-settings-clear"][aria-label="Reset Primary"]')!);
    expect(latest.themeOverrides.colors).toBeUndefined();
  });

  test("reset all goes back to defaults", async () => {
    await mount({
      initial: {
        ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
        layout: "boxed",
        themeOverrides: { colors: { primary: "#7c3aed" } },
      },
    });
    const reset = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Reset all",
    )!;
    await click(reset);
    expect(latest).toEqual(DEFAULT_ADMIN_LAYOUT_SETTINGS);
  });
});

describe("<AdminLayout theme />", () => {
  const items = [{ key: "/a", label: "A" }];
  async function layout(props: Record<string, unknown>) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(createElement(AdminLayout, { items, activeKey: "/a", ...props }, "page")),
    );
  }

  test("layout scope: variables on the AdminLayout root, which gets data-skein-color so the theme style recomputes derived tokens", async () => {
    await layout({
      settings: {
        themeOverrides: { colors: { primary: "#7c3aed", sidebar: "#001529" }, radius: 1 },
      },
    });
    const el = q('[data-slot="admin-layout"]')!;
    expect(el.style.getPropertyValue("--ui-c-primary")).toBe("#7c3aed");
    expect(el.style.getPropertyValue("--ui-radius")).toBe("1rem");
    expect(el.dataset.skeinColor).toBe("custom");
    expect(el.hasAttribute("data-sidebar-color")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--ui-c-primary")).toBe("");
  });

  test("document scope: written to <html> (popups follow), restored on unmount", async () => {
    await layout({
      settings: { themeOverrides: { colors: { primary: "#7c3aed" } } },
      themeScope: "document",
    });
    expect(document.documentElement.style.getPropertyValue("--ui-c-primary")).toBe("#7c3aed");
    expect(q('[data-slot="admin-layout"]')!.hasAttribute("data-skein-color")).toBe(false);
    await act(async () => root!.unmount());
    root = null;
    expect(document.documentElement.style.getPropertyValue("--ui-c-primary")).toBe("");
  });

  test("rewritten when theme changes; restored when theme is removed", async () => {
    await layout({ settings: { themeOverrides: { colors: { primary: "#7c3aed" } } } });
    await act(async () =>
      root!.render(
        createElement(
          AdminLayout,
          {
            items,
            activeKey: "/a",
            settings: { themeOverrides: { colors: { primary: "#16a34a" } } },
          },
          "page",
        ),
      ),
    );
    expect(q('[data-slot="admin-layout"]')!.style.getPropertyValue("--ui-c-primary")).toBe(
      "#16a34a",
    );
    await act(async () =>
      root!.render(createElement(AdminLayout, { items, activeKey: "/a" }, "page")),
    );
    expect(q('[data-slot="admin-layout"]')!.style.getPropertyValue("--ui-c-primary")).toBe("");
  });

  test("recomputed on light / dark switch (reads the nearest data-skein-mode)", async () => {
    document.documentElement.dataset.skeinMode = "light";
    await layout({ settings: { themeOverrides: { colors: { primary: "#2b4acb" } } } });
    const el = q('[data-slot="admin-layout"]')!;
    const light = el.style.getPropertyValue("--ui-c-primary-soft");
    await act(async () => {
      document.documentElement.dataset.skeinMode = "dark";
      await Promise.resolve();
    });
    await act(async () => {});
    expect(el.style.getPropertyValue("--ui-c-primary-soft")).not.toBe(light);
    await act(async () => {
      delete document.documentElement.dataset.skeinMode;
      await Promise.resolve();
    });
  });
});

describe("<AdminLayoutSettings /> theme styles and own presets", () => {
  const SKINS = [
    { id: "heroui", label: "HeroUI", description: "big radius" },
    { id: "antd", label: "Ant Design" },
  ];

  async function mountWith(props: Record<string, unknown>) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    function H() {
      const [value, setValue] = useState<AdminLayoutSettingsValue>({
        ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
        themeStyle: "heroui",
      });
      latest = value;
      return createElement(AdminLayoutSettings, { value, onValueChange: setValue, ...props });
    }
    await act(async () => root!.render(createElement(H)));
  }

  test("no theme style group without themeStyles; with it, clicking one writes value.themeStyle; theme styles and color themes combine", async () => {
    await mountWith({});
    expect(q('[aria-label="Theme style"]')).toBeNull();
    await act(async () => root!.unmount());
    host?.remove();
    await mountWith({ themeStyles: SKINS });
    const items = [...document.querySelectorAll('[data-slot="admin-layout-settings-style"]')];
    expect(items.length).toBe(2);
    expect(items[0]!.getAttribute("aria-checked")).toBe("true");
    await click(items[1]!);
    expect(latest.themeStyle).toBe("antd");
    expect(items[1]!.getAttribute("aria-checked")).toBe("true");
    // Then pick a color theme: the theme style stays, the colors switch to this set
    const purple = [...document.querySelectorAll('[aria-label="Palette"] button')].find(
      (b) => b.textContent === "Purple",
    )!;
    await click(purple);
    expect(latest.themeStyle).toBe("antd");
    expect(latest.themeOverrides.colors).toEqual({ primary: "#7c3aed" });
    // Conversely: switching the theme style leaves the colors alone
    await click(items[0]!);
    expect(latest.themeStyle).toBe("heroui");
    expect(latest.themeOverrides.colors).toEqual({ primary: "#7c3aed" });
  });

  test("a user preset with a theme style: picking it switches theme style, layout and colors together", async () => {
    await mountWith({
      themeStyles: SKINS,
      customPresets: [
        {
          id: "ant",
          label: "Ant",
          settings: {
            themeStyle: "antd",
            layout: "mix",
            themeOverrides: { colors: { primary: "#1677ff" } },
          },
        },
      ],
    });
    await click(
      q('[data-slot="admin-layout-settings-custom"] [data-slot="admin-layout-settings-preset"]')!,
    );
    expect(latest.themeStyle).toBe("antd");
    expect(latest.layout).toBe("mix");
    expect(
      q(
        '[data-slot="admin-layout-settings-custom"] [data-slot="admin-layout-settings-preset"]',
      )!.getAttribute("aria-checked"),
    ).toBe("true");
  });

  test("the Customize heading comes after presets and before layout", async () => {
    await mountWith({});
    const heading = q('[data-slot="admin-layout-settings-heading"]')!;
    expect(heading.textContent).toBe("Customize");
    const presets = q('[data-section="presets"]')!;
    const layout = q('[data-section="layout"]')!;
    expect(
      presets.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(heading.compareDocumentPosition(layout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("save as preset: name and save, the callback gets the full settings (with theme style); no button without onSavePreset", async () => {
    const saved: unknown[] = [];
    await mountWith({ onSavePreset: (p: unknown) => saved.push(p) });
    await click(
      [...document.querySelectorAll("button")].find((b) => b.textContent === "Save as preset")!,
    );
    const input = q<HTMLInputElement>('input[aria-label="Preset name"]')!;
    await act(async () => {
      Reflect.set(HTMLInputElement.prototype, "value", "Mine", input);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      q('[data-slot="admin-layout-settings-save-form"]')!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(saved).toHaveLength(1);
    const preset = saved[0] as { label: string; settings: AdminLayoutSettingsValue };
    expect(preset.label).toBe("Mine");
    expect(preset.settings.themeStyle).toBe("heroui");
    expect(preset.settings.layout).toBe("side");
  });

  test("own presets follow the built-in ones and have a delete button; clicking it calls back with the id", async () => {
    const deleted: string[] = [];
    await mountWith({
      customPresets: [{ id: "c1", label: "Mine", settings: { layout: "top" } }],
      onDeletePreset: (id: string) => deleted.push(id),
    });
    const custom = q('[data-slot="admin-layout-settings-custom"]')!;
    expect(custom.textContent).toContain("Mine");
    await click(custom.querySelector('[data-slot="admin-layout-settings-delete"]')!);
    expect(deleted).toEqual(["c1"]);
    await click(custom.querySelector('[data-slot="admin-layout-settings-preset"]')!);
    expect(latest.layout).toBe("top");
  });
});

describe("<AdminLayoutSettings /> breadcrumb / sidebar + header", () => {
  test("toolbar position: only for the side layout; header writes settings.toolbar, back to sidebar bottom clears it", async () => {
    await mount();
    const pick = (value: string) =>
      click(q(`[data-section="layout"] [aria-label="Toolbar position"] [data-value="${value}"]`)!);
    await pick("header");
    expect(latest.toolbar).toBe("header");
    expect(serializeSettings(latest)).toContain('"toolbar": "header"');
    await pick("sidebar");
    expect(latest.toolbar).toBeUndefined();
    expect(serializeSettings(latest)).not.toContain("toolbar");
    // Switch to another layout: the toolbar position is locked
    await click(q('[data-section="layout"] [aria-label="Layout"] [data-value="top"]')!);
    expect(
      q(
        '[data-section="layout"] [aria-label="Toolbar position"] [data-value="header"]',
      )!.hasAttribute("disabled") ||
        q('[data-section="layout"] [aria-label="Toolbar position"]')!.hasAttribute(
          "data-disabled",
        ) ||
        q(
          '[data-section="layout"] [aria-label="Toolbar position"] [data-value="header"]',
        )!.getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  test("breadcrumb switch: off writes showBreadcrumb:false and disables icons / separator; on clears it", async () => {
    await mount();
    const sw = () => q('[data-section="layout"] [aria-label="Breadcrumb"]')!;
    await click(sw());
    expect(latest.showBreadcrumb).toBe(false);
    expect(serializeSettings(latest)).toContain('"showBreadcrumb": false');
    await click(sw());
    expect(latest.showBreadcrumb).toBeUndefined();
  });

  test("breadcrumb icons / separator: a non-default value is written, back to default clears the field", async () => {
    await mount();
    const pick = (label: string, value: string) =>
      click(q(`[data-section="layout"] [aria-label="${label}"] [data-value="${value}"]`)!);
    await pick("Breadcrumb icons", "first");
    await pick("Breadcrumb separator", "slash");
    expect(latest.breadcrumbIcons).toBe("first");
    expect(latest.breadcrumbSeparator).toBe("slash");
    await pick("Breadcrumb icons", "all");
    await pick("Breadcrumb separator", "chevron");
    expect(latest.breadcrumbIcons).toBeUndefined();
    expect(latest.breadcrumbSeparator).toBeUndefined();
    // Defaults are not written on export in the first place
    expect(serializeSettings(latest)).not.toContain("breadcrumb");
  });
});

describe("<AdminLayoutSettings /> export / import", () => {
  const setValue = (el: HTMLTextAreaElement, text: string) =>
    act(async () => {
      Reflect.set(HTMLTextAreaElement.prototype, "value", text, el);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

  test("the export box holds the current settings as JSON, the Code tab a usage ready to paste", async () => {
    await mount();
    const out = () => q<HTMLTextAreaElement>('textarea[aria-label="Exported settings"]')!;
    expect(JSON.parse(out().value).layout).toBe("side");
    await click(q('[aria-label="Export / import"] [data-value="code"]')!);
    expect(out().value).toContain("<AdminLayout settings={adminLayoutSettings}");
    await click(q('[data-section="layout"] [aria-label="Layout"] [data-value="boxed"]')!);
    expect(out().value).toContain('"layout": "boxed"');
  });

  test("import: pasting exported JSON and importing replaces the settings; bad JSON shows an error and leaves the settings", async () => {
    await mount();
    const input = q<HTMLTextAreaElement>('textarea[aria-label="Import settings"]')!;
    const importBtn = () =>
      [...document.querySelectorAll("button")].find((b) => b.textContent === "Import")!;
    expect(importBtn().hasAttribute("disabled")).toBe(true);
    await setValue(input, "{oops");
    await click(importBtn());
    expect(q('[data-slot="admin-layout-settings-error"]')!.textContent).toContain("Can't import");
    expect(latest.layout).toBe("side");
    await setValue(
      input,
      JSON.stringify({ layout: "column", themeOverrides: { colors: { primary: "#16a34a" } } }),
    );
    expect(q('[data-slot="admin-layout-settings-error"]')).toBeNull();
    await click(importBtn());
    expect(latest.layout).toBe("column");
    expect(latest.themeOverrides.colors).toEqual({ primary: "#16a34a" });
  });
});

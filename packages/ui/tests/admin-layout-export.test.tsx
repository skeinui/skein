// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  AdminLayout,
  DEFAULT_ADMIN_LAYOUT_SETTINGS,
  normalizeSettings,
  parseSettings,
  serializeSettings,
  settingsToCode,
  useAdminLayoutSettings,
} from "../src/index.ts";
import type { AdminLayoutSettingsValue } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Newer Node ships a localStorage that is undefined without --localstorage-file and shadows jsdom's: if missing, add an in-memory one
if (typeof globalThis.localStorage?.clear !== "function") {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      key: (i: number) => [...store.keys()][i] ?? null,
    } satisfies Storage,
  });
}

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
  localStorage.clear();
});

const SAMPLE: AdminLayoutSettingsValue = {
  layout: "mix",
  menuVariant: "default",
  showTabs: false,
  tabVariant: "card",
  themeStyle: "antd",
  themeOverrides: {
    colors: { primary: "#1677ff", sidebar: "#001529" },
    radius: 0.75,
    density: 1.1,
  },
};

describe("export / import", () => {
  test("serialize -> parse round-trips losslessly, with a version", () => {
    const text = serializeSettings(SAMPLE);
    expect(JSON.parse(text).version).toBe(1);
    const back = parseSettings(text);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.value).toEqual(SAMPLE);
  });

  test("not JSON / not an object: error; missing or invalid values: filled with defaults, colors only #rrggbb, numbers clamped to range", () => {
    expect(parseSettings("nope").ok).toBe(false);
    expect(parseSettings("[1,2]").ok).toBe(false);
    expect(parseSettings("null").ok).toBe(false);
    const messy = normalizeSettings({
      layout: "weird",
      menuVariant: 3,
      showTabs: "yes",
      themeOverrides: {
        colors: { primary: "blue", danger: "#FF0000", extra: "#000000" },
        radius: 99,
        density: 0,
      },
      other: 1,
    });
    expect(messy.layout).toBe(DEFAULT_ADMIN_LAYOUT_SETTINGS.layout);
    expect(messy.menuVariant).toBe(DEFAULT_ADMIN_LAYOUT_SETTINGS.menuVariant);
    expect(messy.showTabs).toBe(true);
    expect(messy.themeOverrides.colors).toEqual({ danger: "#ff0000" });
    expect(messy.themeOverrides.radius).toBe(2);
    expect(
      normalizeSettings({ themeOverrides: { radiusSm: 9, radiusLg: 99 } }).themeOverrides,
    ).toMatchObject({
      radiusSm: 2,
      radiusLg: 3,
    });
    expect(messy.themeOverrides.density).toBe(0.8);
    expect(
      normalizeSettings({ themeOverrides: { colors: { field: "#ABCDEF", sidebar: "nope" } } })
        .themeOverrides.colors,
    ).toEqual({ field: "#abcdef" });
    expect(normalizeSettings({ headerFollowsSidebar: false }).headerFollowsSidebar).toBe(false);
    expect(normalizeSettings({ headerFollowsSidebar: true })).not.toHaveProperty(
      "headerFollowsSidebar",
    );
    expect(
      settingsToCode({ ...DEFAULT_ADMIN_LAYOUT_SETTINGS, headerFollowsSidebar: false }),
    ).toContain('"headerFollowsSidebar": false');
    expect(messy).not.toHaveProperty("other");
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_ADMIN_LAYOUT_SETTINGS);
  });

  test("settingsToCode: ready to paste into code, with the settings object, AdminLayout settings usage and a theme style hint", () => {
    const code = settingsToCode(SAMPLE);
    expect(code).toContain('"layout": "mix"');
    expect(code).toContain("<AdminLayout settings={adminLayoutSettings}");
    expect(code).toContain('<ConfigProvider themeStyle="antd"');
    expect(settingsToCode(DEFAULT_ADMIN_LAYOUT_SETTINGS)).not.toContain("ConfigProvider");
    // With custom colors / radius / density, ConfigProvider uses the same themeOverrides
    const custom = settingsToCode({
      ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
      themeOverrides: { radius: 1 },
    });
    expect(custom).toContain(
      "<ConfigProvider themeOverrides={adminLayoutSettings.themeOverrides}>",
    );
    expect(code).toContain("themeOverrides={adminLayoutSettings.themeOverrides}");
  });
});

describe("<AdminLayout settings />", () => {
  const items = [{ key: "/a", label: "A" }];
  async function mount(props: Record<string, unknown>) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        createElement(
          AdminLayout,
          { items, activeKey: "/a", tabs: createElement("i", { id: "tabs" }), ...props },
          "page",
        ),
      ),
    );
  }
  const el = () => document.querySelector<HTMLElement>('[data-slot="admin-layout"]')!;

  test("one settings object applies layout and theme; showTabs false renders no tabs slot", async () => {
    await mount({ settings: SAMPLE });
    expect(el().dataset.layout).toBe("mix");
    expect(el().style.getPropertyValue("--ui-c-primary")).toBe("#1677ff");
    expect(document.querySelector("#tabs")).toBeNull();
  });

  test("individual props win over settings", async () => {
    await mount({ settings: { ...SAMPLE, showTabs: true }, layout: "top" });
    expect(el().dataset.layout).toBe("top");
    expect(document.querySelector("#tabs")).not.toBeNull();
  });
});

describe("useAdminLayoutSettings", () => {
  let current: ReturnType<typeof useAdminLayoutSettings>;
  function H({ storageKey }: { storageKey?: string }) {
    current = useAdminLayoutSettings(storageKey);
    return null;
  }
  async function mount(storageKey?: string) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root!.render(createElement(H, { storageKey })));
  }

  test("updates are saved to localStorage and read back on remount; reset clears them", async () => {
    await mount("k");
    expect(current[0]).toEqual(DEFAULT_ADMIN_LAYOUT_SETTINGS);
    await act(async () => current[1](SAMPLE));
    expect(JSON.parse(localStorage.getItem("k")!).layout).toBe("mix");
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount("k");
    expect(current[0]).toEqual(SAMPLE);
    await act(async () => current[2]());
    expect(localStorage.getItem("k")).toBeNull();
    expect(current[0]).toEqual(DEFAULT_ADMIN_LAYOUT_SETTINGS);
  });

  test("corrupt saved data: back to defaults without throwing; nothing saved without a key", async () => {
    localStorage.setItem("bad", "{oops");
    await mount("bad");
    expect(current[0]).toEqual(DEFAULT_ADMIN_LAYOUT_SETTINGS);
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount();
    await act(async () => current[1](SAMPLE));
    expect(localStorage.length).toBe(1); // only the corrupt one above, nothing added
  });
});

describe("Semi Dark", () => {
  const items = [{ key: "/a", label: "A" }];
  async function mount(props: Record<string, unknown>) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        createElement(AdminLayout, { items, activeKey: "/a", logo: "L", ...props }, "page"),
      ),
    );
  }
  const el = () => document.querySelector<HTMLElement>('[data-slot="admin-layout"]')!;
  const sidebar = () => document.querySelector<HTMLElement>('[data-slot="sidebar-inner"]')!;

  test("on: the root has data-semi-dark, the sidebar uses dark; off: the sidebar uses light; auto: left alone", async () => {
    document.documentElement.dataset.mode = "light";
    await mount({ semiDark: "on" });
    expect(el().hasAttribute("data-semi-dark")).toBe(true);
    expect(sidebar().dataset.theme).toBe("dark");
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount({ semiDark: "off" });
    expect(el().hasAttribute("data-semi-dark")).toBe(false);
    expect(sidebar().dataset.theme).toBe("light");
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount({});
    expect(sidebar().dataset.theme).toBeUndefined();
    await act(async () => {
      delete document.documentElement.dataset.mode;
      await Promise.resolve();
    });
  });

  test("semiDark in settings works the same; a custom sidebar color wins", async () => {
    document.documentElement.dataset.mode = "light";
    await mount({ settings: { semiDark: "on" } });
    expect(el().hasAttribute("data-semi-dark")).toBe(true);
    await act(async () => root!.unmount());
    root = null;
    host?.remove();
    await mount({
      semiDark: "on",
      settings: { themeOverrides: { colors: { sidebar: "#f4faf5" } } },
    });
    expect(el().hasAttribute("data-semi-dark")).toBe(false);
    expect(sidebar().dataset.theme).toBe("light"); // a light sidebar color -> light, not turned dark by semiDark
    await act(async () => {
      delete document.documentElement.dataset.mode;
      await Promise.resolve();
    });
  });

  test("page in dark mode: no effect", async () => {
    document.documentElement.dataset.mode = "dark";
    await mount({ semiDark: "on" });
    expect(el().hasAttribute("data-semi-dark")).toBe(false);
    expect(sidebar().dataset.theme).toBeUndefined();
    await act(async () => {
      delete document.documentElement.dataset.mode;
      await Promise.resolve();
    });
  });

  test("export / import: semiDark round-trips; auto is not written", () => {
    const withOn = serializeSettings({ ...DEFAULT_ADMIN_LAYOUT_SETTINGS, semiDark: "on" });
    expect(JSON.parse(withOn).semiDark).toBe("on");
    expect(JSON.parse(serializeSettings(DEFAULT_ADMIN_LAYOUT_SETTINGS))).not.toHaveProperty(
      "semiDark",
    );
    const back = parseSettings(withOn);
    expect(back.ok && back.value.semiDark).toBe("on");
    expect(normalizeSettings({ semiDark: "maybe" })).not.toHaveProperty("semiDark");
  });
});

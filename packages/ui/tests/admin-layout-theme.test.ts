// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import {
  ADMIN_LAYOUT_THEME_COLORS,
  DEFAULT_ADMIN_LAYOUT_SETTINGS,
  applyThemeColor,
  applyPreset,
  applyThemeVars,
  matchesThemeColor,
  matchesPreset,
  parseSettings,
  serializeSettings,
  sidebarTheme,
  themeVars,
} from "../src/index.ts";

describe("themeVars", () => {
  test("writes only the given entries; missing ones do not appear", () => {
    expect(themeVars({}, "light")).toEqual({});
    const vars = themeVars({ colors: { primary: "#7c3aed" } }, "light");
    expect(vars["--ui-c-primary"]).toBe("#7c3aed");
    expect(vars["--ui-ring"]).toBe("#7c3aed");
    expect(vars["--ui-c-secondary"]).toBeUndefined();
    expect(vars["--ui-bg"]).toBeUndefined();
  });

  test("semantic colors derive fg / soft / text: text on the color takes the higher contrast, text is at least 4.5:1 on white", () => {
    const dark = themeVars({ colors: { primary: "#1d4ed8" } }, "light");
    expect(dark["--ui-c-primary-fg"]).toBe("#ffffff");
    // Green (white text 3.3:1) also uses white text: white on a brand color is the convention, only colors that are too light switch to dark ink
    expect(themeVars({ colors: { primary: "#16a34a" } }, "light")["--ui-c-primary-fg"]).toBe(
      "#ffffff",
    );
    const light = themeVars({ colors: { primary: "#fde047" } }, "light");
    expect(light["--ui-c-primary-fg"]).not.toBe("#ffffff");
    // Light yellow is unreadable on a white background, so text gets darkened
    expect(light["--ui-c-primary-text"]).not.toBe("#fde047");
  });

  test("dark mode: soft is a dark background, text is lightened", () => {
    const light = themeVars({ colors: { primary: "#2b4acb" } }, "light");
    const dark = themeVars({ colors: { primary: "#2b4acb" } }, "dark");
    expect(dark["--ui-c-primary-soft"]).not.toBe(light["--ui-c-primary-soft"]);
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16);
    expect(lum(dark["--ui-c-primary-soft"]!)).toBeLessThan(lum(light["--ui-c-primary-soft"]!));
    expect(dark["--ui-c-primary-text"]).not.toBe("#2b4acb");
  });

  test("dark background: text, borders and neutrals switch to light shades", () => {
    const vars = themeVars({ colors: { background: "#0f1117" } }, "light");
    expect(vars["--ui-bg"]).toBe("#0f1117");
    expect(vars["--ui-fg"]).toBe("#f8fafc");
    const white = themeVars({ colors: { background: "#ffffff" } }, "light");
    expect(white["--ui-fg"]).toBe("#0f172a");
  });

  test("sidebar color: sets --al-sidebar / --al-sidebar-fg; sidebarTheme gives dark / light by lightness", () => {
    const vars = themeVars({ colors: { sidebar: "#001529" } }, "light");
    expect(vars["--al-sidebar"]).toBe("#001529");
    expect(vars["--al-sidebar-fg"]).toBe("#f8fafc");
    expect(sidebarTheme({ colors: { sidebar: "#001529" } })).toBe("dark");
    expect(sidebarTheme({ colors: { sidebar: "#f4faf5" } })).toBe("light");
    expect(sidebarTheme({})).toBeUndefined();
  });

  test("radius: rem values for sm / md / lg, written to the three steps and the roles components read; none appear when unset", () => {
    expect(themeVars({ density: 1.1 }, "light")).toEqual({ "--ui-density": "1.1" });
    const vars = themeVars({ radiusSm: 0.25, radius: 0.75, radiusLg: 1.25, density: 1.1 }, "light");
    expect(vars).toMatchObject({
      "--ui-radius": "0.75rem",
      "--ui-radius-sm": "0.25rem",
      "--ui-radius-md": "0.75rem",
      "--ui-radius-lg": "1.25rem",
      "--ui-r-small": "0.25rem",
      "--ui-r-item": "0.75rem",
      "--ui-r-block": "1.25rem",
      "--ui-r-surface": "1.25rem",
      "--ui-density": "1.1",
    });
    // Only part given: the missing sm / lg are derived from md (x0.5 / x1.5), a missing md uses 0.5rem
    expect(themeVars({ radius: 0.75 }, "light")).toMatchObject({
      "--ui-radius-sm": "0.375rem",
      "--ui-radius-lg": "1.125rem",
    });
    expect(themeVars({ radiusLg: 2 }, "light")).toMatchObject({
      "--ui-radius-md": "0.5rem",
      "--ui-radius-lg": "2rem",
    });
    // Doesn't touch --ui-r-control: heroui's pill controls stay pills
    expect(vars).not.toHaveProperty("--ui-r-control");
    expect(themeVars({ radius: 0, radiusSm: 1 }, "light")["--ui-radius-md"]).toBe("0rem");
  });

  test("the surface color is also the popup background; on a dark background without a surface color popups use a lightened background; input background set separately", () => {
    expect(themeVars({ colors: { surface: "#f8fafc" } }, "light")).toMatchObject({
      "--ui-surface": "#f8fafc",
      "--ui-overlay-bg": "#f8fafc",
    });
    // Only a light background: overlays unchanged (the theme style's own white)
    expect(themeVars({ colors: { background: "#fafbfc" } }, "light")).not.toHaveProperty(
      "--ui-overlay-bg",
    );
    // Dark background with no panel color given: overlay = background lightened by 6%
    const dark = themeVars({ colors: { background: "#0f1117" } }, "light");
    expect(dark["--ui-overlay-bg"]).toBeDefined();
    expect(dark["--ui-overlay-bg"]).not.toBe("#0f1117");
    // If a panel color is given, use it
    expect(
      themeVars({ colors: { background: "#0f1117", surface: "#161922" } }, "light")[
        "--ui-overlay-bg"
      ],
    ).toBe("#161922");
    // Input background: follows the background by default, overridden if field is given
    expect(themeVars({ colors: { background: "#0f1117" } }, "light")["--ui-field-bg"]).toBe(
      "#0f1117",
    );
    expect(
      themeVars({ colors: { background: "#0f1117", field: "#1c2030" } }, "light")["--ui-field-bg"],
    ).toBe("#1c2030");
    expect(themeVars({ colors: { field: "#ffffff" } }, "light")["--ui-field-bg"]).toBe("#ffffff");
  });

  test("--ui-container (the default style's container fill): surface color first, then a dark background, not written for a light background", () => {
    expect(
      themeVars({ colors: { surface: "#161922", background: "#0f1117" } }, "light")[
        "--ui-container"
      ],
    ).toBe("#161922");
    expect(themeVars({ colors: { background: "#0f1117" } }, "light")["--ui-container"]).toBe(
      "#0f1117",
    );
    expect(themeVars({ colors: { background: "#fafbfc" } }, "light")).not.toHaveProperty(
      "--ui-container",
    );
    expect(themeVars({}, "light")).not.toHaveProperty("--ui-container");
  });

  test("invalid colors are ignored", () => {
    expect(themeVars({ colors: { primary: "nope", sidebar: "x" } }, "light")).toEqual({});
  });
});

describe("applyThemeVars", () => {
  test("applies, and restores the original inline values", () => {
    const el = document.createElement("div");
    el.style.setProperty("--ui-radius", "2px");
    const restore = applyThemeVars(el, { "--ui-radius": "1rem", "--ui-c-primary": "#fff" });
    expect(el.style.getPropertyValue("--ui-radius")).toBe("1rem");
    restore();
    expect(el.style.getPropertyValue("--ui-radius")).toBe("2px");
    expect(el.style.getPropertyValue("--ui-c-primary")).toBe("");
  });
});

describe("text color (foreground)", () => {
  test("used when given instead of guessing from the background; without a background only the text color changes", () => {
    const vars = themeVars({ colors: { background: "#fafbfc", foreground: "#1e2328" } }, "light");
    expect(vars["--ui-fg"]).toBe("#1e2328");
    expect(vars["--ui-fg-muted"]).not.toBe("#1e2328");
    expect(themeVars({ colors: { foreground: "#1e2328" } }, "light")["--ui-fg"]).toBe("#1e2328");
    expect(themeVars({ colors: { background: "#fafbfc" } }, "light")["--ui-fg"]).toBe("#0f172a");
  });
});

describe("dark overrides (theme.dark)", () => {
  test("light uses only colors; dark merges dark into colors (missing entries carry over)", () => {
    const theme = {
      colors: { primary: "#167bff", background: "#fafbfc", surface: "#ffffff" },
      dark: { primary: "#378dff", background: "#121416" },
    };
    const light = themeVars(theme, "light");
    const dark = themeVars(theme, "dark");
    expect(light["--ui-c-primary"]).toBe("#167bff");
    expect(light["--ui-bg"]).toBe("#fafbfc");
    expect(dark["--ui-c-primary"]).toBe("#378dff");
    expect(dark["--ui-bg"]).toBe("#121416");
    expect(dark["--ui-surface"]).toBe("#ffffff"); // dark has no surface, carries over the one from colors
    expect(dark["--ui-fg"]).toBe("#f8fafc"); // dark background -> light text
    expect(light["--ui-fg"]).toBe("#0f172a");
  });

  test("export / import keeps dark, invalid colors are dropped", () => {
    const text = serializeSettings({
      ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
      themeOverrides: {
        colors: { primary: "#167bff" },
        dark: { primary: "#378dff", surface: "nope" as string },
      },
    });
    const back = parseSettings(text);
    expect(back.ok && back.value.themeOverrides.dark).toEqual({ primary: "#378dff" });
  });
});

describe("color themes and presets", () => {
  const find = (id: string) => ADMIN_LAYOUT_THEME_COLORS.find((x) => x.id === id)!;

  test("applyThemeColor: replaces all colors, leaves layout / radius / density; default clears all custom colors", () => {
    const base = {
      ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
      layout: "top" as const,
      themeOverrides: { radius: 1, colors: { danger: "#ff0000" } },
    };
    const next = applyThemeColor(base, find("ocean"));
    expect(next.layout).toBe("top");
    expect(next.themeOverrides.radius).toBe(1);
    expect(next.themeOverrides.colors).toEqual({ primary: "#1677ff", sidebar: "#001529" });
    expect(matchesThemeColor(next, find("ocean"))).toBe(true);
    expect(matchesThemeColor(next, find("blue"))).toBe(false);
    // Nexus carries a dark override: once applied dark is there too, and switching to another color theme clears it
    const nexus = applyThemeColor(next, find("nexus"));
    expect(nexus.themeOverrides.dark?.background).toBe("#121416");
    expect(matchesThemeColor(nexus, find("nexus"))).toBe(true);
    expect(applyThemeColor(nexus, find("blue")).themeOverrides.dark).toBeUndefined();
    const cleared = applyThemeColor(next, find("default"));
    expect(cleared.themeOverrides.colors).toBeUndefined();
    expect(matchesThemeColor(cleared, find("default"))).toBe(true);
  });

  test("built-in color theme ids are unique, colors are all valid #rrggbb", () => {
    const ids = ADMIN_LAYOUT_THEME_COLORS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const theme of ADMIN_LAYOUT_THEME_COLORS)
      for (const value of Object.values(theme.colors ?? {}))
        expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  test("presets (saved by users): applyPreset applies layout, theme style and colors; theme is replaced whole", () => {
    const base = {
      ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
      themeOverrides: { radius: 1, colors: { danger: "#ff0000" } },
    };
    const preset = {
      id: "mine",
      label: "Mine",
      settings: {
        themeStyle: "antd",
        layout: "mix" as const,
        themeOverrides: { colors: { primary: "#1677ff" } },
      },
    };
    const next = applyPreset(base, preset);
    expect(next.layout).toBe("mix");
    expect(next.themeStyle).toBe("antd");
    expect(next.themeOverrides.colors).toEqual({ primary: "#1677ff" });
    expect(next.themeOverrides.radius).toBeUndefined();
    expect(matchesPreset(next, preset)).toBe(true);
    expect(matchesPreset({ ...next, layout: "top" }, preset)).toBe(false);
    expect(matchesPreset({ ...next, themeStyle: "heroui" }, preset)).toBe(false);
  });
});

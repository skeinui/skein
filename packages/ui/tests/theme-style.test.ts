import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { BREAKPOINTS, THEME_OVERRIDABLE_TOKENS } from "../src/contract.ts";

/*
 * Specific constraints on the bundled theme styles. Whether a theme style covers the whole contract
 * (tokens, every slot / variant, scoping...) is checked by the CLI, see packages/cli/tests/theme.test.ts.
 */

const ROOT = join(import.meta.dirname, "..");
// Theme styles, colour themes and densities are in @skeinui/themes: packages/themes/<name>/
const PACKAGES_DIR = join(ROOT, "..");
const THEMES_PACKAGE = join(PACKAGES_DIR, "themes");
const skinDir = (skin: string) => join(THEMES_PACKAGE, skin);
const THEMES_DIR = join(THEMES_PACKAGE, "color");
const DENSITY_DIR = join(THEMES_PACKAGE, "density");

// A theme style is a directory with a tokens.css (color/, density/, code/ have none)
const skins = readdirSync(THEMES_PACKAGE, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(THEMES_PACKAGE, e.name, "tokens.css")))
  .map((e) => e.name);
const themes = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".css"));

const read = (...parts: string[]) => readFileSync(join(...parts), "utf8");

/** Extract all declarations of the form `--ui-xxx:` from the CSS (excluding var() references). */
const declaredTokens = (css: string) =>
  new Set([...css.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

describe("Table container", () => {
  // When the scroll container has padding, sticky fixed columns stick inside the padding and scrolling content leaks out of the margin; margins must be drawn with a transparent border
  test.each(skins)("%s table-container has no padding", (skin) => {
    const css = read(skinDir(skin), "table.css");
    const bad = [...css.matchAll(/\[data-slot="table-container"\][^{}]*\{([^}]*)\}/g)]
      .filter((m) => /(^|[;\s])padding(-[a-z]+)?\s*:/.test(m[1] ?? ""))
      .map((m) => m[0].slice(0, 80));
    expect(bad, `${skin}/table.css`).toEqual([]);
  });
});

describe("PageTabs list", () => {
  // The list is a horizontal scroll container (overflow-x: auto makes the vertical axis auto too); a tab using a negative margin to cover the bottom divider would be 1px taller than the container,
  // producing a vertical scrollbar. The divider is drawn as an inset shadow on the root, tabs no longer stick out of the container, and the list also needs an explicit overflow-y: hidden as a fallback
  test.each(skins)(
    "%s tabs have no negative margin-bottom, the list is overflow-y: hidden",
    (skin) => {
      const css = read(skinDir(skin), "page-tabs.css");
      expect(css, `${skin}/page-tabs.css`).not.toMatch(/margin-bottom:\s*-/);
      const list = /\[data-slot="page-tabs-list"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
      expect(list, `${skin}/page-tabs.css`).toMatch(/overflow-y:\s*hidden/);
    },
  );
});

describe("grid breakpoints", () => {
  test.each(skins)("%s grid.css media query breakpoints match BREAKPOINTS", (skin) => {
    const css = read(skinDir(skin), "grid.css");
    const found = [...css.matchAll(/@media \(min-width: (\d+)px\)/g)].map((m) => Number(m[1]));
    const expected = Object.values(BREAKPOINTS).filter((px) => px > 0);
    expect([...new Set(found)].sort((x, y) => x - y)).toEqual(expected);
  });
});

describe("heroui control heights read the height scale (so density / custom heights take effect)", () => {
  test.each([
    "input.css",
    "select.css",
    "tabs.css",
    "segmented.css",
    "table.css",
    "menu.css",
    "button.css",
    "pagination.css",
  ])("%s uses --ui-height-*", (file) => {
    expect(read(skinDir("heroui"), file)).toContain("var(--ui-height-");
  });
  test.each([
    "tag.css",
    "kbd.css",
    "avatar.css",
    "otp-field.css",
    "tabs.css",
    "table.css",
    "menu.css",
    "card.css",
    "alert.css",
    "segmented.css",
    "number-field.css",
  ])("%s sizes are multiplied by --ui-density", (file) => {
    expect(read(skinDir("heroui"), file)).toContain("* var(--ui-density)");
  });
});

describe("all theme styles: control sizes / spacing are multiplied by --ui-density (so compact / custom density takes effect)", () => {
  describe.each(skins)("%s", (skin) => {
    test.each([
      "tag.css",
      "avatar.css",
      "tabs.css",
      "table.css",
      "card.css",
      "alert.css",
      "segmented.css",
      "menu.css",
      "accordion.css",
      "switch.css",
      "checkbox.css",
      "slider.css",
      "progress.css",
      "calendar.css",
    ])("%s", (file) => {
      expect(read(skinDir(skin), file)).toContain("* var(--ui-density)");
    });
  });
});

describe("settings panel in a drawer: same width in all five theme styles", () => {
  test.each(skins)("%s has the shared width rule", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    expect(css).toMatch(
      /\[data-slot="drawer"\]\[data-side\]\[data-size\]:has\(\[data-slot="admin-layout-settings"\]\)\s*\{\s*width: 28rem;/,
    );
  });
});

describe("drawer: with Drawer.Body only the Body scrolls, the header (title / close button) stays put", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "drawer.css");
    expect(css).toContain(':has(> [data-slot="dialog-body"])');
    expect(css).toMatch(
      /\[data-slot="drawer-content"\] > \[data-slot="dialog-body"\] \{[^}]*overflow-y: auto;/,
    );
  });
});

describe("antd color picker: the swatch in the trigger follows the trigger height", () => {
  test("sm / md / lg each have a swatch size rule", () => {
    const css = read(skinDir("antd"), "color-picker.css");
    for (const size of ["sm", "md", "lg"])
      expect(css).toContain(`width: calc(var(--ui-height-${size}) - 8px)`);
  });
});

describe("custom sidebar color in the boxed layout: shell, frame and header all use it", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    expect(css).toMatch(
      /\[data-sidebar-color\]\s*\[data-slot="sidebar-provider"\]\s*\{[^}]*--_bg: var\(--al-sidebar\);/,
    );
    // The frame and header follow the sidebar color, unless data-header-follow="off"
    expect(css).toMatch(
      /\[data-layout="boxed"\]\[data-sidebar-color\]:not\(\s*\[data-header-follow="off"\]\s*\)\s*\{\s*--_boxed: var\(--al-sidebar\);/,
    );
  });
});

describe("the side layout header inside the content area (data-header-inset) doesn't darken with Semi Dark / the sidebar color", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    // Semi Dark's dark header rule excludes headers inside the content area
    expect(css).toMatch(
      /\[data-semi-dark\]:not\(\[data-header-inset\]\)\s*:is\(\s*\[data-slot="admin-layout-header"\]/,
    );
    // The header doesn't draw its own background, it uses the content area's
    expect(css).toMatch(
      /\[data-header-inset\]\s*\[data-slot="admin-layout-header"\]\s*\{\s*background-color: transparent;/,
    );
  });
});

describe("sidebar collapse / expand transition", () => {
  test.each(skins)(
    "%s: no invalid easing keywords (ease-linear is a Tailwind class; in a transition it invalidates the whole declaration and nothing animates)",
    (skin) => {
      for (const file of readdirSync(skinDir(skin)).filter((f) => f.endsWith(".css")))
        expect(read(skinDir(skin), file), `${skin}/${file}`).not.toContain("ease-linear");
    },
  );

  test.each(skins)(
    "%s: gap and panel width transitions only after data-animate (no animation for width changes on load), off with reduced motion",
    (skin) => {
      const css = read(skinDir(skin), "sidebar.css");
      expect(css).toMatch(
        /\[data-slot="sidebar"\]\[data-animate\]\s*\[data-slot="sidebar-gap"\]\s*\{\s*transition: width 300ms cubic-bezier\(0\.2, 0, 0, 1\);/,
      );
      expect(css).toMatch(
        /\[data-slot="sidebar"\]\[data-animate\]\s*\[data-slot="sidebar-container"\]\s*\{\s*transition:\s*width 300ms cubic-bezier\(0\.2, 0, 0, 1\),\s*translate 300ms cubic-bezier\(0\.2, 0, 0, 1\),\s*visibility 300ms;/,
      );
      // The base rule without data-animate has no transition (otherwise the first-frame change would play)
      expect(css).not.toMatch(
        new RegExp(
          `\\[data-skein-theme="${skin}"\\]\\s*\\[data-slot="sidebar-gap"\\]\\s*\\{[^}]*transition`,
        ),
      );
      // Reduced motion: the transitions are turned off with a selector of the same specificity
      expect(css).toMatch(
        /prefers-reduced-motion: reduce\)\s*\{[^@]*\[data-slot="sidebar"\]\[data-animate\]\s*\[data-slot="sidebar-gap"\][^{]*\{\s*transition: none;/,
      );
    },
  );
});

describe("no jumps on sidebar collapse / expand: row spacing on li, row height kept when collapsed, logo doesn't wrap", () => {
  test.each(skins)(
    "%s: vertical row spacing is on li, links / triggers have no vertical margin",
    (skin) => {
      const css = read(skinDir(skin), "side-menu.css");
      // If the trigger's bottom margin stays in the li, a row with a group is one gap taller than a normal row; when the sidebar collapses the panel disappears and the icons below all shift up
      expect(css).toMatch(/margin: 0 var\(--_mx\);/);
      expect(css).not.toMatch(/margin: var\(--_my\) var\(--_mx\);/);
      expect(css).toMatch(
        /:is\(\[data-slot="sidemenu-item"\], \[data-slot="sidemenu-submenu"\]\)\s*\{\s*margin-block: var\(--_my\);/,
      );
    },
  );

  test.each(["default", "shadcn"])(
    "%s: square items keep 11px when collapsed (the 3rem rail minus a 1px border is 47px; 12px would shrink the row to 35)",
    (skin) => {
      const css = read(skinDir(skin), "side-menu.css");
      expect(css).toContain("--_sq: min(calc(100% - 0.6875rem), var(--_h));");
    },
  );

  test.each(skins)(
    "%s: logo parts don't shrink with the frame (the icon isn't squeezed to 0 width while expanding), the small label isn't animated on its own",
    (skin) => {
      const css = read(skinDir(skin), "admin-layout.css");
      expect(css).toMatch(/\[data-slot="admin-layout-logo"\] > \* \{\s*flex: none;/);
      // The collapsed small title and the menu icon follow the same path (centered in the shrinking frame), and must not be fixed width / stuck to the left
      expect(css).not.toMatch(
        /\[data-slot="admin-layout-logo-mark"\]\s*\{[^}]*align-self: flex-start/,
      );
    },
  );

  test.each(skins)(
    "%s: collapsed square items shorter than the row are padded vertically, li is its own formatting context (icon stays in place, modern row 42 > square 36)",
    (skin) => {
      const css = read(skinDir(skin), "side-menu.css");
      expect(css).toMatch(/--_sq: min\(/);
      expect(css).toContain("inline-size: var(--_sq);");
      expect(css).toContain("margin-block: calc((var(--_h) - var(--_sq)) / 2);");
      // The added margin must not collapse with the li's own margin (collapsing takes the larger value, so it wouldn't be made up in full)
      expect(css).toMatch(
        /\[data-collapsed\]\s*:is\(\[data-slot="sidemenu-item"\], \[data-slot="sidemenu-submenu"\]\)\s*\{\s*display: flow-root;/,
      );
    },
  );

  test.each(skins)(
    "%s: AdminLayout logo and context switcher are nowrap (the frame is still narrow during the expand transition, mustn't wrap to two lines)",
    (skin) => {
      const css = read(skinDir(skin), "admin-layout.css");
      expect(css).toMatch(
        /:is\(\[data-slot="admin-layout-logo"\], \[data-slot="admin-layout-context"\]\)\s*\{\s*white-space: nowrap;/,
      );
    },
  );
});

describe("header and tab bar inside the content area form one block", () => {
  test.each(skins)(
    "%s: with a tab bar below, only a faint line separates header and tab bar; the header also uses the chrome tab bar's light background",
    (skin) => {
      const css = read(skinDir(skin), "admin-layout.css");
      expect(css).toMatch(
        /\[data-header-inset\]:has\(\[data-slot="admin-layout-bar"\]\)\s*\[data-slot="admin-layout-header"\]\s*\{\s*border-bottom-color: color-mix\(in srgb, var\(--ui-border\) 45%, transparent\);/,
      );
      expect(css).toMatch(
        /\[data-header-inset\]:has\(\s*\[data-slot="admin-layout-bar"\] > \[data-slot="page-tabs"\]\[data-variant="chrome"\]\s*\)\s*\[data-slot="admin-layout-header"\]\s*\{\s*background-color: color-mix\(in srgb, var\(--ui-c-neutral-soft\) 45%, transparent\);/,
      );
    },
  );
});

describe("accessibility: text on light backgrounds uses the -text variant (contrast)", () => {
  test.each(skins)("%s: active tab and active column item text is --ui-c-primary-text", (skin) => {
    const tabs = read(skinDir(skin), "page-tabs.css");
    expect(tabs).toMatch(
      /\[data-slot="page-tabs-item"\]\[data-active\] \{\s*color: var\(--ui-c-primary-text\);/,
    );
    const layout = read(skinDir(skin), "admin-layout.css");
    expect(layout).toMatch(
      /\[data-slot="admin-layout-rail-item"\]\[data-active\] \{\s*background-color: color-mix\(in srgb, var\(--ui-c-primary\) 10%, transparent\);\s*color: var\(--ui-c-primary-text\);/,
    );
  });
});

describe("default style: header + tab bar use the container color (white), set apart from the grey page by color", () => {
  test("header and tab bar backgrounds are --ui-container (including chrome's light background)", () => {
    const css = read(skinDir("default"), "admin-layout.css");
    expect(css).toMatch(
      /\[data-header-inset\]:has\(\s*\[data-slot="admin-layout-bar"\] > \[data-slot="page-tabs"\]\[data-variant\]\s*\)\s*\[data-slot="admin-layout-header"\]\s*\{\s*background-color: var\(--ui-container\);/,
    );
    expect(css).toMatch(
      /\[data-slot="admin-layout"\]\[data-header-inset\]\s*\[data-slot="admin-layout-bar"\]:has\(> \[data-slot="page-tabs"\]\)\s*\{\s*background-color: var\(--ui-container\);/,
    );
  });
});

describe("collapsed sidebar footer toolbar keeps only the last item (avatar)", () => {
  test.each(skins)(
    "%s: earlier buttons hidden, the toolbar keeps the button height (avatar stays in place)",
    (skin) => {
      const css = read(skinDir(skin), "admin-layout.css");
      expect(css).toMatch(
        /\[data-collapsible="icon"\]\s*\[data-slot="sidebar-footer"\]\s*\[data-slot="admin-layout-actions"\]\s*> :not\(\[data-base-ui-focus-guard\], \[aria-owns\]\):has\(\s*~ :not\(\[data-base-ui-focus-guard\], \[aria-owns\]\)\s*\) \{\s*display: none;/,
      );
      expect(css).toMatch(
        /\[data-collapsible="icon"\]\s*\[data-slot="sidebar-footer"\]\s*\[data-slot="admin-layout-actions"\] \{\s*min-block-size: 2rem;/,
      );
    },
  );
});

describe("header inside the content area (data-header-inset): 3rem (48px) high, always a sidebar toggle on the left", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    expect(css).toMatch(
      /\[data-slot="admin-layout"\]\[data-header-inset\]\s*\{\s*--_header: 3rem;/,
    );
    expect(css).toMatch(
      /\[data-header-inset\]\s*\[data-slot="admin-layout-header"\]\s*\[data-slot="admin-layout-sidebar-trigger"\]\s*\{\s*display: inline-flex;/,
    );
  });
});

describe("admin tab bar: every tab style gives it the same height (0.25rem above the tabs)", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    expect(css).toMatch(
      /\[data-slot="admin-layout-bar"\]\s*>\s*\[data-slot="page-tabs"\]\s*\{\s*padding-top: 0.25rem;/,
    );
  });
});

describe("card tabs in the admin tab bar: room above and below (not against the header's divider), 1rem in on the left", () => {
  test.each(skins)("%s", (skin) => {
    const css = read(skinDir(skin), "admin-layout.css");
    expect(css).toMatch(
      /\[data-slot="admin-layout-bar"\]\s*>\s*\[data-slot="page-tabs"\]\[data-variant="card"\]\s*\{\s*padding-block: 0.25rem;\s*padding-inline-start: 1rem;/,
    );
  });
});

describe("sidebar menu alignment: submenu guide line under the parent icon, child icons aligned with parent text, right edges aligned", () => {
  test.each(["default", "shadcn", "heroui"])(
    "%s: guide line and indent come from the menu spacing variables",
    (skin) => {
      const css = read(skinDir(skin), "side-menu.css");
      expect(css).toContain(
        "margin-inline: calc(var(--_mx) + var(--_pl) + var(--_icon) / 2 - 0.5px) var(--_mx);",
      );
      expect(css).toContain(
        "padding-inline-start: calc(var(--_gap) + var(--_icon) / 2 - var(--_pl) - 0.5px);",
      );
    },
  );

  test("default: in AdminLayout the default menu style has 36px rows, 32px children", () => {
    const css = read(skinDir("default"), "admin-layout.css");
    expect(css).toMatch(
      /\[data-slot="sidemenu"\]:not\(\[data-variant="modern"\]\)\s*\{\s*--_h: 2\.25rem;/,
    );
    expect(css).toMatch(/\[data-slot="sidemenu-panel-inner"\]\s*:is\([^)]*\)\s*\{\s*--_h: 2rem;/);
  });

  test("shadcn: the menu has the shadcn/ui sidebar's sizes, in AdminLayout too: 32px rows, 28px children, 4px apart", () => {
    const menu = read(skinDir("shadcn"), "side-menu.css");
    expect(menu).toMatch(/\[data-slot="sidemenu"\]\s*\{\s*--_h: 2rem;[^}]*--_my: 0\.25rem;/);
    expect(menu).toMatch(
      /\[data-slot="sidemenu-panel-inner"\] \[data-slot="sidemenu-trigger"\]\s*\{[^}]*--_h: 1\.75rem;/,
    );
    // AdminLayout does not override them
    const css = read(skinDir("shadcn"), "admin-layout.css");
    expect(css).not.toMatch(
      /\[data-slot="sidemenu"\]:not\(\[data-variant="modern"\]\)\s*\{\s*--_h:/,
    );
  });

  test.each(skins)(
    "%s: the side layout sidebar header has no extra bottom padding (first menu row lines up with the tab bar)",
    (skin) => {
      const css = read(skinDir(skin), "admin-layout.css");
      expect(css).toMatch(/\[data-slot="sidebar-header"\][^{]*\{\s*padding-block-end: 0;/);
    },
  );
});

describe("default style: raised layers (light page slightly grey, containers white; dark unchanged)", () => {
  test("light --ui-bg is grey, --ui-surface / --ui-container are white; dark container matches the page", () => {
    const light = read(skinDir("default"), "tokens.css");
    expect(light).toMatch(/--ui-bg: #f8fafc;/);
    expect(light).toMatch(/--ui-surface: #ffffff;/);
    expect(light).toMatch(/--ui-container: #ffffff;/);
    const dark = read(skinDir("default"), "dark.css");
    expect(dark).toMatch(/--ui-container: var\(--ui-bg\);/);
  });
});

describe("color theme contract", () => {
  test.each(themes)("theme %s overrides only allowed tokens, in the ui-color layer", (file) => {
    const css = read(THEMES_DIR, file);
    const illegal = [...declaredTokens(css)].filter((t) => !THEME_OVERRIDABLE_TOKENS.includes(t));
    expect(illegal, `themes can't override derived / shape tokens: ${illegal.join(", ")}`).toEqual(
      [],
    );
    expect(css).toContain("@layer ui-color");
  });

  test.each(readdirSync(DENSITY_DIR).filter((f) => f.endsWith(".css")))(
    "density %s overrides only --ui-density, in the ui-color layer",
    (file) => {
      const css = read(DENSITY_DIR, file);
      expect([...declaredTokens(css)]).toEqual(["--ui-density"]);
      expect(css).toContain("@layer ui-color");
    },
  );
});

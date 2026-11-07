import { Fragment, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { ColorPicker } from "../color-picker/index.ts";
import { Input, Textarea } from "../input/index.ts";
import { Segmented } from "../segmented/index.ts";
import { Slider } from "../slider/index.ts";
import { Switch } from "../switch/index.ts";
import type { PageTabsVariant } from "../page-tabs/index.ts";
import type { AdminLayoutMode, AdminLayoutToolbar } from "./admin-layout.tsx";
import {
  ADMIN_LAYOUT_THEME_COLORS,
  DEFAULT_ADMIN_LAYOUT_SETTINGS,
  applyThemeColor,
  applyPreset,
  matchesThemeColor,
  matchesPreset,
  parseSettings,
  presetFrom,
  serializeSettings,
  settingsToCode,
} from "./settings.ts";
import type {
  AdminLayoutThemeColor,
  AdminLayoutPreset,
  AdminLayoutSettingsExtra,
  AdminLayoutSettingsValue,
} from "./settings.ts";
import { DEFAULT_RADIUS } from "./theme.ts";
import type { AdminLayoutColors } from "./theme.ts";

/** The current theme style's own three border radius steps (rem). Steps differ per style, so the sliders must start from these values or they jump on first touch. */
interface StyleRadius {
  md: number;
  sm: number;
  lg: number;
  /** Height (rem) of a medium control at density 1: shown next to the density slider as the actual effect. */
  hMd: number;
  /** How many px 1rem is (the page root font size). */
  px: number;
}

/** Measures the current actual radius of the sm / md / lg steps (a probe element reads the var, the browser resolves calc); re-measured when theme style, mode or color changes. */
function useStyleRadius(host: React.RefObject<HTMLElement | null>): StyleRadius {
  const [radius, setRadius] = useState<StyleRadius>({
    md: DEFAULT_RADIUS,
    sm: DEFAULT_RADIUS * 0.5,
    lg: DEFAULT_RADIUS * 1.5,
    hMd: 2.25,
    px: 16,
  });
  useEffect(() => {
    const el = host.current;
    if (!el || typeof getComputedStyle !== "function") return;
    const measure = () => {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      el.append(probe);
      const read = (token: string) => {
        probe.style.borderRadius = `var(${token})`;
        return parseFloat(getComputedStyle(probe).borderTopLeftRadius) / root;
      };
      const md = read("--ui-radius-md");
      const sm = read("--ui-radius-sm");
      const lg = read("--ui-radius-lg");
      // Divide the medium control height by the current density so the density slider can compute "how many px at x"
      probe.style.borderRadius = "";
      probe.style.height = "var(--ui-height-md)";
      const density = parseFloat(getComputedStyle(probe).getPropertyValue("--ui-density")) || 1;
      const hMd = parseFloat(getComputedStyle(probe).height) / root / density;
      probe.remove();
      if (![md, sm, lg, hMd].every(Number.isFinite) || md <= 0) return;
      const round = (n: number) => Math.round(n * 1000) / 1000;
      setRadius((prev) => {
        const next = {
          md: round(md),
          sm: round(sm),
          lg: round(lg),
          hMd: round(hMd),
          px: root,
        };
        return prev.md === next.md &&
          prev.sm === next.sm &&
          prev.lg === next.lg &&
          prev.hMd === next.hMd &&
          prev.px === next.px
          ? prev
          : next;
      });
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-skein-theme",
        "data-skein-color",
        "data-skein-density",
        "data-skein-mode",
      ],
    });
    return () => observer.disconnect();
  }, [host]);
  return radius;
}

type Without<T> = Omit<T, "className" | "style" | "onChange" | "defaultValue">;

export type AdminLayoutSettingsSection = "presets" | "layout" | "colors" | "shape" | "export";

/** One entry in the "Theme style" section: offers whichever theme styles the app has imported. */
export interface AdminLayoutThemeStyleOption {
  /** Theme style id, as passed to `ConfigProvider`'s `themeStyle` (e.g. `"antd"`); stored in `value.themeStyle`. */
  id: string;
  /** Display name in the panel. */
  label: string;
  /** Optional short line shown under the name. */
  description?: string;
}

export interface AdminLayoutSettingsLabels {
  sections: Record<AdminLayoutSettingsSection, string>;
  /** The three sub-groups in the color section. */
  colorGroups: Record<"brand" | "status" | "page" | "panel" | "navigation" | "field", string>;
  headerFollowsSidebar: string;
  layout: string;
  menuStyle: string;
  showTabs: string;
  /** Semi Dark: the name, the three options, and the note shown when locked (sidebar color customized). */
  semiDark: string;
  semiDarks: { auto: string; on: string; off: string };
  semiDarkLocked: string;
  tabStyle: string;
  /** Breadcrumb: names and options for icon display and separator style. */
  /** Toolbar position (side layout): the name, two options, and the note shown when locked in other layouts. */
  toolbar: string;
  toolbarPositions: Record<AdminLayoutToolbar, string>;
  toolbarLocked: string;
  /** Toggle for showing the breadcrumb. */
  showBreadcrumb: string;
  breadcrumbIcons: string;
  breadcrumbIconModes: Record<"all" | "first" | "none", string>;
  breadcrumbSeparator: string;
  breadcrumbSeparators: Record<"chevron" | "slash", string>;
  layouts: Record<AdminLayoutMode, string>;
  menuStyles: { default: string; modern: string };
  tabStyles: Record<PageTabsVariant, string>;
  colors: Record<keyof AdminLayoutColors, string>;
  radius: string;
  radiusSm: string;
  radiusLg: string;
  /** The line above the three radius sliders: rem to px conversion. */
  radiusUnit: (px: number) => string;
  /** The effect shown next to the density slider: how many px a medium control is at this density. */
  densityEffect: (px: number) => string;
  density: string;
  /** Small text shown next to a color that is not customized. */
  themeStyleDefault: string;
  clear: (name: string) => string;
  reset: string;
  /** Export / import section. */
  formats: { json: string; code: string };
  copy: string;
  copied: string;
  exportOutput: string;
  importLabel: string;
  importPlaceholder: string;
  import: string;
  importError: (reason: string) => string;
  /** Save as preset: the button, name input, save / cancel, and deleting one of your own saved presets. */
  savePreset: string;
  presetName: string;
  save: string;
  cancel: string;
  deletePreset: (name: string) => string;
  /** Sub-heading for your own saved presets. */
  myPresets: string;
  /** The two sub-headings of the preset section: theme style and color; plus the names of built-in color themes (by id). */
  themeStyle: string;
  themeColor: string;
  themeColors: Record<string, string>;
  /** The "Custom" heading: the layout, colors, radius and density under it are adjusted by the user. */
  custom: string;
}

export interface AdminLayoutSettingsProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Current settings, controlled. */
  value: AdminLayoutSettingsValue;
  onValueChange: (value: AdminLayoutSettingsValue) => void;
  /**
   * The app's own settings, the ones its `children` sections change (JSON values by name): the export carries them
   * (under `extra`), so it covers the whole panel, and an import hands them back to `onExtraChange`.
   */
  extra?: AdminLayoutSettingsExtra;
  /** An import held app settings (`extra`): apply them. Check what you read; it is whatever the text said. */
  onExtraChange?: (extra: AdminLayoutSettingsExtra) => void;
  /** Color themes (can be combined freely with theme styles); defaults to the built-in `ADMIN_LAYOUT_THEME_COLORS`. */
  themeColors?: readonly AdminLayoutThemeColor[];
  /** Theme styles provided by the app; without it there is no "Theme style" section. Once selected, `value.themeStyle` becomes its id, to be passed to `ConfigProvider`'s `themeStyle`. */
  themeStyles?: readonly AdminLayoutThemeStyleOption[];
  /** Presets saved by the user (right after `presets`, deletable). Where they are stored is up to the app. */
  customPresets?: readonly AdminLayoutPreset[];
  /** When provided, the preset section shows "Save as preset": the current settings (including theme style) are saved under a name, the callback receives the new preset, and the app persists it. */
  onSavePreset?: (preset: AdminLayoutPreset) => void;
  /** When provided, each of `customPresets` gets a delete button; receives the preset's `id`, and the app removes it from storage. */
  onDeletePreset?: (id: string) => void;
  /** Which sections to show and in what order; all by default. */
  sections?: readonly AdminLayoutSettingsSection[];
  /** The settings that "Reset" returns to; defaults to `DEFAULT_ADMIN_LAYOUT_SETTINGS`. */
  defaults?: AdminLayoutSettingsValue;
  labels?: Partial<AdminLayoutSettingsLabels>;
  /** Content appended after the last section and before "Reset all": the app's own settings sections (unknown to the library). */
  children?: ReactNode;
}

/** Colors are grouped by the area the user sees: brand, status, page (background / text), panel (cards + overlays), navigation (sidebar), input. */
const COLOR_GROUPS: readonly {
  id: "brand" | "status" | "page" | "panel" | "navigation" | "field";
  keys: readonly (keyof AdminLayoutColors)[];
}[] = [
  { id: "brand", keys: ["primary", "secondary"] },
  { id: "status", keys: ["success", "warning", "danger"] },
  { id: "page", keys: ["background", "foreground"] },
  { id: "panel", keys: ["surface"] },
  { id: "navigation", keys: ["sidebar"] },
  { id: "field", keys: ["field"] },
];

/** When not customized, the color the picker shows first (just a starting point, not written into the settings). */
const STARTING_POINT: Record<keyof AdminLayoutColors, string> = {
  primary: "#2563eb",
  secondary: "#4f46e5",
  success: "#15803d",
  warning: "#f59e0b",
  danger: "#dc2626",
  background: "#ffffff",
  foreground: "#0f172a",
  surface: "#f8fafc",
  field: "#ffffff",
  sidebar: "#0f172a",
};

const dot = (color: string | undefined, fallback: string) => ({
  "--dot": color ?? fallback,
});

/**
 * Layout settings panel: layout / menu style / tab style, presets, custom colors (primary, secondary, status colors, background, panel, sidebar), radius and density.
 * Data-driven and controlled: it edits `AdminLayoutSettingsValue`; where it is stored (localStorage, backend) is up to you;
 * pass parts of `value` to `AdminLayout` (`layout`, `menuVariant`, `theme`...) to take effect. Use it inside a Drawer / Popover.
 * Use `sections` to show only some of the sections.
 */
export function AdminLayoutSettings({
  value,
  onValueChange,
  extra,
  onExtraChange,
  themeColors = ADMIN_LAYOUT_THEME_COLORS,
  themeStyles,
  customPresets = [],
  onSavePreset,
  onDeletePreset,
  sections = ["presets", "layout", "colors", "shape", "export"],
  defaults = DEFAULT_ADMIN_LAYOUT_SETTINGS,
  labels: labelsProp,
  children,
  ...rest
}: AdminLayoutSettingsProps) {
  const labels = useLabels("adminLayoutSettings", labelsProp);
  const [saving, setSaving] = useState(false);
  const [format, setFormat] = useState<"json" | "code">("json");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const colors = value.themeOverrides.colors ?? {};
  const set = (patch: Partial<AdminLayoutSettingsValue>) => onValueChange({ ...value, ...patch });
  const setColors = (next: AdminLayoutColors) => {
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== ""),
    ) as AdminLayoutColors;
    // When an item changes, its dark-mode override is dropped too (the color you picked is used for both light and dark)
    const changed = (Object.keys({ ...colors, ...cleaned }) as (keyof AdminLayoutColors)[]).filter(
      (key) => colors[key] !== cleaned[key],
    );
    const dark = { ...value.themeOverrides.dark };
    for (const key of changed) delete dark[key];
    set({
      themeOverrides: {
        ...value.themeOverrides,
        colors: Object.keys(cleaned).length > 0 ? cleaned : undefined,
        dark: Object.keys(dark).length > 0 ? dark : undefined,
      },
    });
  };
  const setTheme = (patch: Partial<AdminLayoutSettingsValue["themeOverrides"]>) =>
    set({ themeOverrides: { ...value.themeOverrides, ...patch } });
  const rootRef = useRef<HTMLDivElement>(null);
  const styleRadius = useStyleRadius(rootRef);
  const radiusNow = {
    radius: value.themeOverrides.radius ?? styleRadius.md,
    radiusSm: value.themeOverrides.radiusSm ?? styleRadius.sm,
    radiusLg: value.themeOverrides.radiusLg ?? styleRadius.lg,
  };
  // Write all three together: if only one is written, the other two are derived from md and the theme style's own steps are lost
  const showRem = (n: number) => `${n}rem · ${Math.round(n * styleRadius.px * 10) / 10}px`;
  const setRadius = (patch: Partial<typeof radiusNow>) => setTheme({ ...radiusNow, ...patch });

  const nameOf = (preset: AdminLayoutPreset) => preset.label ?? preset.id;

  const presetButton = (preset: AdminLayoutPreset) => {
    const active = matchesPreset(value, preset);
    const c = preset.settings.themeOverrides?.colors;
    return (
      <button
        key={preset.id}
        type="button"
        role="radio"
        aria-checked={active}
        data-slot="admin-layout-settings-preset"
        data-active={active ? "" : undefined}
        onClick={() => onValueChange(applyPreset(value, preset))}
      >
        <span data-slot="admin-layout-settings-dots" aria-hidden="true">
          <i
            data-slot="admin-layout-settings-dot"
            ref={(el) => setVars(el, dot(c?.primary, STARTING_POINT.primary))}
          />
          <i
            data-slot="admin-layout-settings-dot"
            ref={(el) => setVars(el, dot(c?.secondary ?? c?.surface ?? c?.background, "#e2e8f0"))}
          />
          <i
            data-slot="admin-layout-settings-dot"
            ref={(el) => setVars(el, dot(c?.sidebar ?? c?.background, "#f1f5f9"))}
          />
        </span>
        <span data-slot="admin-layout-settings-name">{nameOf(preset)}</span>
      </button>
    );
  };

  const colorRow = (key: keyof AdminLayoutColors) => {
    const current = colors[key];
    return (
      <Field key={key} label={labels.colors[key]} inline>
        <span data-slot="admin-layout-settings-color">
          {current ? null : (
            <small data-slot="admin-layout-settings-hint">{labels.themeStyleDefault}</small>
          )}
          <ColorPicker
            size="sm"
            showValue
            aria-label={labels.colors[key]}
            value={current ?? STARTING_POINT[key]}
            onValueChange={(next) => setColors({ ...colors, [key]: next })}
          />
          {current ? (
            <button
              type="button"
              data-slot="admin-layout-settings-clear"
              aria-label={labels.clear(labels.colors[key])}
              title={labels.clear(labels.colors[key])}
              onClick={() => setColors({ ...colors, [key]: undefined })}
            >
              <svg
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </span>
      </Field>
    );
  };

  const render: Record<AdminLayoutSettingsSection, () => ReactNode> = {
    presets: () => (
      <>
        {(themeStyles?.length ?? 0) > 0 ? (
          <div data-slot="admin-layout-settings-group">
            <h5 data-slot="admin-layout-settings-subtitle">{labels.themeStyle}</h5>
            <div
              data-slot="admin-layout-settings-styles"
              role="radiogroup"
              aria-label={labels.themeStyle}
            >
              {(themeStyles ?? []).map((style) => {
                const active = value.themeStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-slot="admin-layout-settings-style"
                    data-active={active ? "" : undefined}
                    onClick={() => set({ themeStyle: style.id })}
                  >
                    <span data-slot="admin-layout-settings-style-name">{style.label}</span>
                    {style.description ? (
                      <small data-slot="admin-layout-settings-style-note">
                        {style.description}
                      </small>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div data-slot="admin-layout-settings-group">
          <h5 data-slot="admin-layout-settings-subtitle">{labels.themeColor}</h5>
          <div
            data-slot="admin-layout-settings-presets"
            role="radiogroup"
            aria-label={labels.themeColor}
          >
            {themeColors.map((theme) => {
              const active = matchesThemeColor(value, theme);
              const c = theme.colors;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-slot="admin-layout-settings-preset"
                  data-active={active ? "" : undefined}
                  onClick={() => onValueChange(applyThemeColor(value, theme))}
                >
                  <span data-slot="admin-layout-settings-dots" aria-hidden="true">
                    <i
                      data-slot="admin-layout-settings-dot"
                      ref={(el) => setVars(el, dot(c?.primary, STARTING_POINT.primary))}
                    />
                    <i
                      data-slot="admin-layout-settings-dot"
                      ref={(el) =>
                        setVars(el, dot(c?.secondary ?? c?.surface ?? c?.background, "#e2e8f0"))
                      }
                    />
                    <i
                      data-slot="admin-layout-settings-dot"
                      ref={(el) => setVars(el, dot(c?.sidebar ?? c?.background, "#f1f5f9"))}
                    />
                  </span>
                  <span data-slot="admin-layout-settings-name">
                    {labels.themeColors[theme.id] ?? theme.label ?? theme.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {customPresets.length > 0 ? (
          <div data-slot="admin-layout-settings-group">
            <h5 data-slot="admin-layout-settings-subtitle">{labels.myPresets}</h5>
            <div
              data-slot="admin-layout-settings-presets"
              role="radiogroup"
              aria-label={labels.myPresets}
            >
              {customPresets.map((preset) => (
                <span key={preset.id} data-slot="admin-layout-settings-custom">
                  {presetButton(preset)}
                  {onDeletePreset ? (
                    <button
                      type="button"
                      data-slot="admin-layout-settings-delete"
                      aria-label={labels.deletePreset(nameOf(preset))}
                      title={labels.deletePreset(nameOf(preset))}
                      onClick={() => onDeletePreset(preset.id)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="1em"
                        height="1em"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {onSavePreset ? (
          saving ? (
            <form
              data-slot="admin-layout-settings-save-form"
              onSubmit={(e) => {
                e.preventDefault();
                const name = presetName.trim();
                if (!name) return;
                onSavePreset(presetFrom(value, `custom-${Date.now().toString(36)}`, name));
                setSaving(false);
                setPresetName("");
              }}
            >
              <Input
                size="sm"
                autoFocus
                aria-label={labels.presetName}
                placeholder={labels.presetName}
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <Button size="sm" type="submit" disabled={presetName.trim() === ""}>
                {labels.save}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="neutral"
                onClick={() => {
                  setSaving(false);
                  setPresetName("");
                }}
              >
                {labels.cancel}
              </Button>
            </form>
          ) : (
            <Button size="sm" variant="ghost" color="neutral" onClick={() => setSaving(true)}>
              {labels.savePreset}
            </Button>
          )
        ) : null}
      </>
    ),
    layout: () => (
      <>
        <Field label={labels.layout}>
          <Segmented
            size="sm"
            fullWidth
            aria-label={labels.layout}
            value={value.layout}
            onValueChange={(v) => set({ layout: v as AdminLayoutMode })}
            options={(["side", "top", "mix", "column", "boxed"] as const).map((v) => ({
              value: v,
              label: labels.layouts[v],
            }))}
          />
        </Field>
        <div data-slot="admin-layout-settings-row">
          <Field label={labels.menuStyle}>
            <Segmented
              size="sm"
              fullWidth
              aria-label={labels.menuStyle}
              value={value.menuVariant}
              onValueChange={(v) => set({ menuVariant: v as "default" | "modern" })}
              options={[
                { value: "default", label: labels.menuStyles.default },
                { value: "modern", label: labels.menuStyles.modern },
              ]}
            />
          </Field>
          <Field label={labels.tabStyle}>
            <Segmented
              size="sm"
              fullWidth
              aria-label={labels.tabStyle}
              disabled={!value.showTabs}
              value={value.tabVariant}
              onValueChange={(v) => set({ tabVariant: v as PageTabsVariant })}
              options={(["card", "chrome", "line"] as const).map((v) => ({
                value: v,
                label: labels.tabStyles[v],
              }))}
            />
          </Field>
        </div>
        <Field label={labels.toolbar}>
          <Segmented
            size="sm"
            fullWidth
            aria-label={labels.toolbar}
            disabled={value.layout !== "side"}
            value={value.toolbar ?? "sidebar"}
            onValueChange={(v) => set({ toolbar: v === "sidebar" ? undefined : (v as "header") })}
            options={(["sidebar", "header"] as const).map((v) => ({
              value: v,
              label: labels.toolbarPositions[v],
            }))}
          />
          {value.layout !== "side" ? (
            <small data-slot="admin-layout-settings-hint">{labels.toolbarLocked}</small>
          ) : null}
        </Field>
        <Field label={labels.showBreadcrumb} inline>
          <Switch
            aria-label={labels.showBreadcrumb}
            checked={value.showBreadcrumb !== false}
            onCheckedChange={(on) => set({ showBreadcrumb: on ? undefined : false })}
          />
        </Field>
        <div data-slot="admin-layout-settings-row">
          <Field label={labels.breadcrumbIcons}>
            <Segmented
              size="sm"
              fullWidth
              aria-label={labels.breadcrumbIcons}
              disabled={value.showBreadcrumb === false}
              value={value.breadcrumbIcons ?? "all"}
              onValueChange={(v) =>
                set({ breadcrumbIcons: v === "all" ? undefined : (v as "first" | "none") })
              }
              options={(["all", "first", "none"] as const).map((v) => ({
                value: v,
                label: labels.breadcrumbIconModes[v],
              }))}
            />
          </Field>
          <Field label={labels.breadcrumbSeparator}>
            <Segmented
              size="sm"
              fullWidth
              aria-label={labels.breadcrumbSeparator}
              disabled={value.showBreadcrumb === false}
              value={value.breadcrumbSeparator ?? "chevron"}
              onValueChange={(v) =>
                set({ breadcrumbSeparator: v === "chevron" ? undefined : (v as "slash") })
              }
              options={(["chevron", "slash"] as const).map((v) => ({
                value: v,
                label: labels.breadcrumbSeparators[v],
              }))}
            />
          </Field>
        </div>
        <Field label={labels.semiDark}>
          <Segmented
            size="sm"
            fullWidth
            aria-label={labels.semiDark}
            disabled={Boolean(colors.sidebar)}
            value={value.semiDark ?? "auto"}
            onValueChange={(v) => set({ semiDark: v === "auto" ? undefined : (v as "on" | "off") })}
            options={[
              { value: "auto", label: labels.semiDarks.auto },
              { value: "on", label: labels.semiDarks.on },
              { value: "off", label: labels.semiDarks.off },
            ]}
          />
          {colors.sidebar ? (
            <small data-slot="admin-layout-settings-hint">{labels.semiDarkLocked}</small>
          ) : null}
        </Field>
        <Field label={labels.showTabs} inline>
          <Switch
            aria-label={labels.showTabs}
            checked={value.showTabs}
            onCheckedChange={(on) => set({ showTabs: on })}
          />
        </Field>
      </>
    ),
    colors: () => (
      <>
        {COLOR_GROUPS.map((group) => (
          <div key={group.id} data-slot="admin-layout-settings-group">
            <h5 data-slot="admin-layout-settings-subtitle">{labels.colorGroups[group.id]}</h5>
            {group.keys.map((key) => colorRow(key))}
            {group.id === "navigation" ? (
              <Field label={labels.headerFollowsSidebar} inline>
                <Switch
                  aria-label={labels.headerFollowsSidebar}
                  checked={value.headerFollowsSidebar !== false}
                  onCheckedChange={(on) => set({ headerFollowsSidebar: on ? undefined : false })}
                />
              </Field>
            ) : null}
          </div>
        ))}
      </>
    ),
    export: () => {
      const output =
        format === "json" ? serializeSettings(value, extra) : settingsToCode(value, extra);
      return (
        <>
          <Segmented
            size="sm"
            fullWidth
            aria-label={labels.sections.export}
            value={format}
            onValueChange={(v) => setFormat(v as "json" | "code")}
            options={[
              { value: "json", label: labels.formats.json },
              { value: "code", label: labels.formats.code },
            ]}
          />
          <Textarea
            readOnly
            fullWidth
            rows={8}
            aria-label={labels.exportOutput}
            value={output}
            onFocus={(e) => e.currentTarget.select()}
          />
          <div data-slot="admin-layout-settings-actions">
            <Button
              size="sm"
              variant="outline"
              color="neutral"
              onClick={() => {
                void navigator.clipboard?.writeText(output).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? labels.copied : labels.copy}
            </Button>
          </div>
          <Textarea
            fullWidth
            rows={4}
            aria-label={labels.importLabel}
            placeholder={labels.importPlaceholder}
            value={importText}
            onValueChange={(v) => {
              setImportText(v);
              setImportError(null);
            }}
          />
          {importError ? (
            <p data-slot="admin-layout-settings-error" role="alert">
              {labels.importError(importError)}
            </p>
          ) : null}
          <div data-slot="admin-layout-settings-actions">
            <Button
              size="sm"
              disabled={importText.trim() === ""}
              onClick={() => {
                const result = parseSettings(importText);
                if (!result.ok) return setImportError(result.error);
                onValueChange(result.value);
                if (result.extra) onExtraChange?.(result.extra);
                setImportText("");
              }}
            >
              {labels.import}
            </Button>
          </div>
        </>
      );
    },
    shape: () => (
      <>
        <small data-slot="admin-layout-settings-hint">{labels.radiusUnit(styleRadius.px)}</small>
        <Field label={labels.radiusSm} wide>
          <Slider
            label={labels.radiusSm}
            showValue
            formatValue={showRem}
            min={0}
            max={2}
            step={0.0625}
            value={radiusNow.radiusSm}
            onValueChange={(v) => setRadius({ radiusSm: Array.isArray(v) ? v[0] : (v as number) })}
          />
        </Field>
        <Field label={labels.radius} wide>
          <Slider
            label={labels.radius}
            showValue
            formatValue={showRem}
            min={0}
            max={2}
            step={0.0625}
            value={radiusNow.radius}
            onValueChange={(v) => setRadius({ radius: Array.isArray(v) ? v[0] : (v as number) })}
          />
        </Field>
        <Field label={labels.radiusLg} wide>
          <Slider
            label={labels.radiusLg}
            showValue
            formatValue={showRem}
            min={0}
            max={3}
            step={0.0625}
            value={radiusNow.radiusLg}
            onValueChange={(v) => setRadius({ radiusLg: Array.isArray(v) ? v[0] : (v as number) })}
          />
        </Field>
        <Field label={labels.density} wide>
          <Slider
            label={labels.density}
            showValue
            min={0.8}
            max={1.3}
            step={0.05}
            formatValue={(n) =>
              `×${n} · ${labels.densityEffect(Math.round(styleRadius.hMd * n * styleRadius.px * 10) / 10)}`
            }
            value={value.themeOverrides.density ?? 1}
            onValueChange={(v) => setTheme({ density: Array.isArray(v) ? v[0] : (v as number) })}
          />
        </Field>
      </>
    ),
  };

  return (
    <div {...rest} ref={rootRef} data-slot="admin-layout-settings">
      {sections.map((section, i) => (
        <Fragment key={section}>
          {section !== "presets" && !sections.slice(0, i).some((s) => s !== "presets") ? (
            <h3 data-slot="admin-layout-settings-heading">{labels.custom}</h3>
          ) : null}
          <section data-slot="admin-layout-settings-section" data-section={section}>
            <h4 data-slot="admin-layout-settings-title">{labels.sections[section]}</h4>
            {render[section]()}
          </section>
        </Fragment>
      ))}
      {children}
      <Button variant="outline" color="neutral" size="sm" onClick={() => onValueChange(defaults)}>
        {labels.reset}
      </Button>
    </div>
  );
}

/** One row: text on the left and control on the right (inline), or text on top with the control filling the width (default / wide). */
function Field({
  label,
  inline = false,
  wide = false,
  children,
}: {
  label: string;
  inline?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="admin-layout-settings-field"
      data-inline={inline ? "" : undefined}
      data-wide={wide ? "" : undefined}
    >
      {wide ? null : <span data-slot="admin-layout-settings-label">{label}</span>}
      {children}
    </div>
  );
}

/** The color is a dynamic value and the component writes no style: a ref sets it as a CSS variable (--dot), and the theme style paints with var(--dot). */
function setVars(el: HTMLElement | null, vars: Record<string, string>) {
  if (!el) return;
  for (const [key, val] of Object.entries(vars)) el.style.setProperty(key, val);
}

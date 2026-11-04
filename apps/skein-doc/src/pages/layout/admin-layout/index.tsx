import {
  AdminLayout,
  AdminLayoutSettings,
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  KeepAlive,
  Menu,
  PageTabs,
  Segmented,
  Switch,
  openTab,
  trailOf,
  useAdminLayoutSettings,
} from "@skeinui/ui";
import type {
  AdminLayoutMode,
  AdminLayoutToolbar,
  AdminLayoutPreset,
  AdminLayoutSettingsValue,
  AdminNavItem,
  PageTab,
  PageTabsVariant,
} from "@skeinui/ui";
import { AdminLayoutShowcase } from "./showcase.tsx";
import { useShellT } from "./shell-t.ts";
import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { THEME_STYLE_INFO, useSettings } from "@/site/settings.ts";
import type { ThemeStyle } from "@/site/settings.ts";

/** `AdminNavItem`'s fields; their descriptions are the page's `nav.<key>` messages. */
const NAV_ITEM = [
  { key: "key", name: "key", type: "string" },
  { key: "label", name: "label", type: "ReactNode" },
  { key: "icon", name: "icon", type: "ReactNode" },
  { key: "href", name: "href", type: "string" },
  { key: "titleField", name: "title", type: "string" },
  { key: "disabled", name: "disabled", type: "boolean" },
  { key: "children", name: "children", type: "AdminNavItem[]" },
];

/** The exported helpers; their descriptions are the page's `helpers.<key>` messages. */
const HELPERS = [
  { key: "trailOf", name: "trailOf(items, key)", type: "AdminNavItem[] | null" },
  { key: "firstLeaf", name: "firstLeaf(item)", type: "AdminNavItem" },
  { key: "activeTopOf", name: "activeTopOf(items, key)", type: "AdminNavItem | undefined" },
];

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "admin-layout", type: "root" },
  { key: "logo", name: "admin-layout-logo / logo-mark", type: "div" },
  { key: "header", name: "admin-layout-header", type: "header" },
  { key: "nav", name: "admin-layout-nav / nav-item", type: "nav" },
  { key: "rail", name: "admin-layout-rail / rail-item", type: "nav" },
  { key: "subnav", name: "admin-layout-subnav / subnav-toggle", type: "div / button" },
  { key: "main", name: "admin-layout-main / body / bar / content / footer", type: "div" },
  { key: "bar", name: "admin-layout-bar-actions / bar-button", type: "div / button" },
  { key: "drawer", name: "admin-layout-drawer", type: "div" },
];

const dot = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const ICONS = {
  home: dot(<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  building: dot(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4" />
    </>,
  ),
  apps: dot(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
  ),
  chart: dot(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  list: dot(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />),
  settings: dot(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>,
  ),
  layers: dot(<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5" />),
  key: dot(
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M16 7l3 3" />
    </>,
  ),
  shield: dot(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />),
};

function useNav() {
  const t = useShellT("shell");
  const items: AdminNavItem[] = [
    { key: "/dashboard", label: t("dashboard"), icon: ICONS.home },
    {
      key: "tenants",
      label: t("tenants"),
      icon: ICONS.building,
      children: [
        { key: "/tenants/list", label: t("tenantList"), icon: ICONS.list },
        { key: "/tenants/settings", label: t("settings"), icon: ICONS.settings },
      ],
    },
    {
      key: "apps",
      label: t("applications"),
      icon: ICONS.apps,
      children: [
        { key: "/apps/list", label: t("allApplications"), icon: ICONS.layers },
        { key: "/apps/keys", label: t("apiKeys"), icon: ICONS.key },
        { key: "/apps/roles", label: t("roles"), icon: ICONS.shield },
      ],
    },
    { key: "/reports", label: t("reports"), icon: ICONS.chart },
    { key: "/components", label: t("components"), icon: ICONS.layers },
  ];
  return { items, t };
}

const iconOf = (items: readonly AdminNavItem[], key: string): ReactNode => {
  for (const item of items) {
    if (item.key === key) return item.icon;
    const below = item.children ? iconOf(item.children, key) : undefined;
    if (below) return below;
  }
  return undefined;
};

/** A shield icon, the demo's logo; gradient / mask ids use useId, so rendering logo and logoMark together doesn't clash. */
function BrandIcon() {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  return (
    <svg viewBox="0 0 64 64" width="24" height="24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={id("edge")}
          x1="10"
          y1="4"
          x2="54"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={id("a")} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={id("b")} x1="56" y1="8" x2="8" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={id("r")} x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <mask id={id("gap")}>
          <rect width="64" height="64" fill="#fff" />
          <circle cx="32" cy="32" r="13.5" fill="#000" />
        </mask>
      </defs>
      <path
        d="M32 3.5C38.5 7.5 46 9.8 54 10.3V30C54 44.5 45 54.5 32 60.5C19 54.5 10 44.5 10 30V10.3C18 9.8 25.5 7.5 32 3.5Z"
        fill="#eef2ff"
        stroke={`url(#${id("edge")})`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g transform="translate(32 29.5) scale(.6) translate(-32 -32)">
        <g mask={`url(#${id("gap")})`} strokeWidth="8.5" strokeLinecap="round">
          <path d="M12 12 52 52" stroke={`url(#${id("a")})`} />
          <path d="M52 12 12 52" stroke={`url(#${id("b")})`} />
        </g>
        <circle cx="32" cy="32" r="8.5" stroke={`url(#${id("r")})`} strokeWidth="5.5" />
      </g>
    </svg>
  );
}

const SUN = dot(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
);
const MOON = dot(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);

const GEAR = dot(
  <>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </>,
);

const BELL = dot(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>,
);

/**
 * Demo avatars: the first three from youmind's "AI avatar generation" sample images (realistic / 3D cartoon / flat illustration), cropped to head and shoulders, 256px WebP,
 * stored under public/avatars, no network needed. To switch to another, just change the index.
 */
const AVATARS = ["/avatars/avatar-1.webp", "/avatars/avatar-2.webp", "/avatars/avatar-3.webp"];
const AVATAR_SRC = AVATARS[0]!;

const USER = dot(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
);
const COG = dot(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </>,
);
const HELP = dot(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
  </>,
);
const LOGOUT = dot(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </>,
);

/**
 * The avatar's user menu (modeled on common admin UIs): at the top an account info card, then profile / account settings / notifications, after a divider
 * appearance (dark mode) and help, and finally the dangerous sign out. When the sidebar collapses to a narrow strip the toolbar keeps only the avatar, and all other entries are here.
 */
function UserMenu({
  t,
  mode,
  onModeChange,
  placement,
}: {
  t: (key: string) => string;
  /** If not passed there is no "dark mode" item (the small embedded demo ignores the page-wide light / dark). */
  mode?: "light" | "dark";
  onModeChange?: (mode: "light" | "dark") => void;
  /** Toolbar at the bottom of the sidebar: pops out to the right; at the right of the header: pops out downward. */
  placement: "sidebar" | "header";
}) {
  return (
    <Menu>
      <Menu.Trigger
        // The avatar itself is round: the trigger is just a round button with no background (no square background on hover / open), and the focus ring becomes round too (see playground.css)
        render={<button type="button" className="pg-avatar-trigger" />}
        aria-label={t("account")}
      >
        <Avatar size="sm" alt="William" src={AVATAR_SRC} fallback="W" />
      </Menu.Trigger>
      <Menu.Content side={placement === "sidebar" ? "right" : "bottom"} align="end">
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 8px 8px" }}>
          {/* The avatar is decorative here (the name is right next to it): out of the accessibility tree, a menu can't hold an img */}
          <Avatar aria-hidden="true" alt="" src={AVATAR_SRC} fallback="W" />
          <div style={{ display: "grid", lineHeight: 1.3 }}>
            <strong>William</strong>
            <span style={{ opacity: 0.65, fontSize: "0.75rem" }}>you@example.com</span>
          </div>
        </div>
        <Menu.Separator />
        <Menu.Item>
          {USER}
          {t("profile")}
        </Menu.Item>
        <Menu.Item>
          {COG}
          {t("accountSettings")}
        </Menu.Item>
        <Menu.Item>
          {BELL}
          {t("notifications")}
        </Menu.Item>
        <Menu.Separator />
        {mode && onModeChange ? (
          <Menu.Item onClick={() => onModeChange(mode === "dark" ? "light" : "dark")}>
            {mode === "dark" ? SUN : MOON}
            {mode === "dark" ? t("lightMode") : t("darkMode")}
          </Menu.Item>
        ) : null}
        <Menu.Item>
          {HELP}
          {t("helpDocs")}
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item color="danger">
          {LOGOUT}
          {t("signOut")}
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

const leafTitle = (items: readonly AdminNavItem[], key: string): string => {
  for (const item of items) {
    if (item.key === key) return typeof item.label === "string" ? item.label : key;
    const below = item.children ? leafTitle(item.children, key) : "";
    if (below) return below;
  }
  return "";
};

/** Each page has a counter: it should still be there after switching tabs / navigating (KeepAlive). */
function Page({ name, pageKey }: { name: string; pageKey: string }) {
  const [n, setN] = useState(0);
  if (pageKey === "/components") return <AdminLayoutShowcase />;
  return (
    <div style={{ padding: 16, display: "grid", gap: 8, justifyItems: "start" }}>
      <strong>{name}</strong>
      <Button size="sm" variant="outline" color="neutral" onClick={() => setN((v) => v + 1)}>
        {n}
      </Button>
    </div>
  );
}

const THEME_STYLE_OPTIONS = Object.entries(THEME_STYLE_INFO).map(([id, info]) => ({
  id,
  label: info.name,
}));
const PRESET_STORE = "skein.ui.admin-layout-presets";

/** Presets saved by the user go in localStorage (the library only emits data, where to store it is the app's business). */
function useStoredPresets() {
  const [presets, setPresets] = useState<AdminLayoutPreset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PRESET_STORE) ?? "[]") as AdminLayoutPreset[];
    } catch {
      return [];
    }
  });
  const update = (next: AdminLayoutPreset[]) => {
    setPresets(next);
    try {
      localStorage.setItem(PRESET_STORE, JSON.stringify(next));
    } catch {
      // When storage is unavailable (private mode and the like), keep it in memory only
    }
  };
  return [presets, update] as const;
}

function ShellDemo({
  initialLayout = "side" as AdminLayoutMode,
  switcher = true,
  showControls = false,
  customizable = false,
  fullscreen = false,
  tenantSwitcher: tenantSwitcherProp = undefined as boolean | undefined,
}) {
  const { items, t } = useNav();
  /** A tenant switcher (context slot) isn't needed by every admin: the docs page example has it, the full-page demo doesn't. */
  const tenantSwitcher = tenantSwitcherProp ?? !fullscreen;
  /** "Demo slots": these positions are all optional AdminLayout slots and aren't rendered if not passed - tick them to see how it looks with / without. */
  const [slots, setSlots] = useState({
    logo: true,
    tenant: tenantSwitcher,
    breadcrumb: true,
    notifications: true,
    mode: fullscreen,
    avatar: true,
    footer: true,
  });
  const [layoutState, setLayout] = useState<AdminLayoutMode>(initialLayout);
  const [active, setActive] = useState("/dashboard");
  const [tabs, setTabs] = useState<readonly PageTab[]>([
    { key: "/dashboard", title: t("dashboard"), pinned: true },
  ]);
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [toolbarState, setToolbar] = useState<AdminLayoutToolbar>("sidebar");
  const [menuVariantState, setMenuVariant] = useState<"default" | "modern">("modern");
  const [tabVariantState, setTabVariant] = useState<PageTabsVariant>("chrome");
  /** Whether page tabs are enabled (the console's "Show Tab Bar"): when off there is no tab bar, and pages aren't kept alive either (only the current page is kept). */
  const [showTabsState, setShowTabs] = useState(true);
  /** customizable: these four items and the theme are decided by the settings panel. */
  // The full-page demo saves its settings to localStorage, so they persist after a refresh
  const [settings, setSettings] = useAdminLayoutSettings(
    fullscreen ? "skein.ui.admin-layout.settings" : undefined,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const layout = customizable ? settings.layout : layoutState;
  /** Whether the toolbar (actions) is at the bottom of the sidebar (user menu pops to the right) or at the right of the header (pops downward). */
  const toolbarInSidebar =
    layout === "side" && (customizable ? settings.toolbar : toolbarState) !== "header";
  const menuVariant = customizable ? settings.menuVariant : menuVariantState;
  const tabVariant = customizable ? settings.tabVariant : tabVariantState;
  const showTabs = customizable ? settings.showTabs : showTabsState;
  const [versions, setVersions] = useState<Record<string, number>>({});
  const tenants = [t("acmeInc"), t("globex")];
  const [tenant, setTenant] = useState(0);

  const app = useSettings();
  const slotToggles: [keyof typeof slots, string][] = [
    ["logo", t("logo")],
    ["tenant", t("tenantSwitcher")],
    ["breadcrumb", t("breadcrumb")],
    ["notifications", t("notifications")],
    ...(fullscreen ? [["mode", t("lightDarkToggle")] as [keyof typeof slots, string]] : []),
    ["avatar", t("userAvatar")],
    ["footer", t("footer")],
  ];
  const slotsPanel = (
    <section className="pg-slots">
      <h4>{t("demoSlots")}</h4>
      <p>{t("slotsHint")}</p>
      {slotToggles.map(([key, label]) => (
        <div key={key} className="pg-slot-row">
          <span>{label}</span>
          <Switch
            aria-label={label}
            checked={slots[key]}
            onCheckedChange={(on) => setSlots((s) => ({ ...s, [key]: on }))}
          />
        </div>
      ))}
    </section>
  );

  // After a refresh, restore the saved theme style (the full-page demo's theme style is normally decided by the address bar parameter, but if saved in the settings the settings win)
  useEffect(() => {
    if (fullscreen && settings.themeStyle && settings.themeStyle !== app.themeStyle)
      app.set.themeStyle(settings.themeStyle as ThemeStyle);
    // Restore only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [customPresets, setCustomPresets] = useStoredPresets();
  const panelValue: AdminLayoutSettingsValue = { ...settings, themeStyle: app.themeStyle };
  const onSettings = (next: AdminLayoutSettingsValue) => {
    if (next.themeStyle && next.themeStyle !== app.themeStyle)
      app.set.themeStyle(next.themeStyle as ThemeStyle);
    // When page tabs are reopened, add the current page (pages visited while they were off have no tab)
    if (next.showTabs && !settings.showTabs)
      setTabs((all) => openTab(all, { key: active, title: leafTitle(items, active) || active }));
    setSettings(next);
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      {customizable && !fullscreen ? (
        <div style={{ flex: "0 0 300px", maxWidth: "100%" }}>
          <AdminLayoutSettings
            value={panelValue}
            onValueChange={onSettings}

            themeStyles={THEME_STYLE_OPTIONS}
            customPresets={customPresets}
            onSavePreset={(preset) => setCustomPresets([...customPresets, preset])}
            onDeletePreset={(id) => setCustomPresets(customPresets.filter((p) => p.id !== id))}
          >
            {slotsPanel}
          </AdminLayoutSettings>
        </div>
      ) : null}
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        {switcher ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <Segmented
              aria-label="Layout"
              value={layout}
              onValueChange={(v) => setLayout(v as AdminLayoutMode)}
              options={["side", "top", "mix", "column", "boxed"]}
            />
            <Segmented
              aria-label="Toolbar"
              value={layout === "side" ? toolbarState : "header"}
              disabled={layout !== "side"}
              onValueChange={(v) => setToolbar(v as AdminLayoutToolbar)}
              options={["sidebar", "header"]}
            />
            <Segmented
              aria-label="Menu style"
              value={menuVariant}
              onValueChange={(v) => setMenuVariant(v as "default" | "modern")}
              options={["default", "modern"]}
            />
            <Switch
              checked={showTabs}
              onCheckedChange={(on) => {
                setShowTabs(on);
                // Pages visited while off have no tab: on opening, add the current page
                if (on)
                  setTabs((all) =>
                    openTab(all, { key: active, title: leafTitle(items, active) || active }),
                  );
              }}
            >
              {t("pageTabs")}
            </Switch>
            <Segmented
              aria-label="Tab style"
              value={tabVariant}
              onValueChange={(v) => setTabVariant(v as PageTabsVariant)}
              options={["card", "chrome", "line"]}
              disabled={!showTabs}
            />
          </div>
        ) : null}
        {showControls ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Button
              size="sm"
              variant="outline"
              color="neutral"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? t("expand") : t("collapse")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="neutral"
              onClick={() => setMaximized((v) => !v)}
            >
              {maximized ? t("restoreContent") : t("maximizeContent")}
            </Button>
          </div>
        ) : null}
        <div
          style={
            fullscreen
              ? { height: "100vh", overflow: "hidden" }
              : { height: 520, overflow: "hidden", border: "1px solid #8884", borderRadius: 8 }
          }
        >
          <AdminLayout
            // Use the settings panel's result directly: one settings prop applies layout / menu style / theme (tabs also aren't rendered when showTabs is false)
            settings={customizable ? settings : undefined}
            layout={customizable ? undefined : layout}
            toolbar={customizable ? undefined : toolbarState}
            items={items}
            activeKey={active}
            onNavigate={(key, item, event) => {
              event.preventDefault();
              setActive(key);
              if (showTabs)
                setTabs((all) =>
                  openTab(all, { key, title: typeof item.label === "string" ? item.label : key }),
                );
            }}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            maximized={maximized}
            onMaximizedChange={setMaximized}
            onRefresh={() => setVersions((v) => ({ ...v, [active]: (v[active] ?? 0) + 1 }))}
            menuVariant={customizable ? undefined : menuVariant}
            // Full-page demo: the theme is written to <html>, and overlays such as menus and drawers change with it; the preview in the docs page only affects the inside of its frame
            themeScope={fullscreen ? "document" : "layout"}
            logoMark={<BrandIcon />}
            logo={
              slots.logo ? (
                <>
                  <BrandIcon />
                  <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                    Skein Console
                  </span>
                  {/* As in the console's AppLogo: a PRO mark and the version over the name's top right, taking no height */}
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignSelf: "flex-start",
                      height: 0,
                      marginLeft: 2,
                      marginTop: 5,
                      overflow: "visible",
                      fontSize: 9,
                      lineHeight: 1.15,
                    }}
                  >
                    <b style={{ color: "#16a34a" }}>PRO</b>
                    <span style={{ opacity: 0.6, fontWeight: 400 }}>v0.1.0</span>
                  </span>
                </>
              ) : undefined
            }
            // context slot: context switcher next to the logo, here a tenant switcher (the console's "Select tenant"). Not every admin needs it: if not passed there is none, and the full-page demo doesn't pass it
            context={
              slots.tenant ? (
                <Menu>
                  <Menu.Trigger
                    render={<Button size="sm" variant="outline" color="neutral" fullWidth />}
                    aria-label={t("switchTenant")}
                  >
                    <span style={{ flex: 1, textAlign: "start" }}>{tenants[tenant]}</span>
                    {/* Up / down arrows: a hint that this is a switchable dropdown */}
                    {dot(<path d="m7 15 5 5 5-5M7 9l5-5 5 5" />)}
                  </Menu.Trigger>
                  <Menu.Content align="start">
                    {tenants.map((name, i) => (
                      <Menu.Item key={name} onClick={() => setTenant(i)}>
                        {name}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu>
              ) : undefined
            }
            actions={
              slots.notifications || (fullscreen && slots.mode) || slots.avatar ? (
                <>
                  {slots.notifications ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      color="neutral"
                      aria-label={t("notifications")}
                    >
                      {BELL}
                    </Button>
                  ) : null}
                  {fullscreen && slots.mode ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      color="neutral"
                      aria-label={app.mode === "dark" ? t("lightMode") : t("darkMode")}
                      onClick={() => app.set.mode(app.mode === "dark" ? "light" : "dark")}
                    >
                      {app.mode === "dark" ? SUN : MOON}
                    </Button>
                  ) : null}
                  {slots.avatar ? (
                    <UserMenu
                      t={t}
                      mode={fullscreen ? app.mode : undefined}
                      onModeChange={fullscreen ? (m) => app.set.mode(m) : undefined}
                      placement={toolbarInSidebar ? "sidebar" : "header"}
                    />
                  ) : null}
                </>
              ) : undefined
            }
            // The breadcrumb is a slot: the path is walked out of the navigation tree with trailOf (top level -> ... -> current page), and group items above have no page, they're just text
            breadcrumb={
              slots.breadcrumb ? (
                <Breadcrumb
                  items={(trailOf(items, active) ?? []).map((item) => ({
                    icon: item.icon,
                    label: item.label,
                  }))}
                />
              ) : undefined
            }
            tabs={
              showTabs ? (
                <PageTabs
                  aria-label="Pages"
                  variant={tabVariant}
                  tabs={tabs.map((x) => ({ ...x, icon: x.icon ?? iconOf(items, x.key) }))}
                  activeKey={active}
                  onActiveKeyChange={setActive}
                  onTabsChange={setTabs}
                />
              ) : undefined
            }
            footer={slots.footer ? "© 2026 Skein UI" : undefined}
          >
            <KeepAlive
              activeKey={active}
              // Without a tab bar there are no "open pages": only the current page is kept, equivalent to no keep-alive
              keepKeys={showTabs ? tabs.map((x) => x.key) : [active]}
              versions={versions}
              transition="fade"
            >
              <Page name={leafTitle(items, active) || active} pageKey={active} />
            </KeepAlive>
          </AdminLayout>
        </div>
      </div>
      {fullscreen && import.meta.env.DEV ? (
        // A floating settings button that exists only in development: bottom right, taking no space in the header / sidebar (that is where the light / dark toggle is)
        <button
          type="button"
          className="pg-fab"
          aria-label={t("customize")}
          onClick={() => setPanelOpen(true)}
        >
          {GEAR}
        </button>
      ) : null}
      {fullscreen ? (
        <Drawer open={panelOpen} onOpenChange={setPanelOpen} side="right">
          <Drawer.Content size="md">
            <Drawer.Title>{t("customize")}</Drawer.Title>
            <Drawer.Description>{t("customizeHint")}</Drawer.Description>
            <Drawer.Body>
              <AdminLayoutSettings
                value={panelValue}
                onValueChange={onSettings}
                themeStyles={THEME_STYLE_OPTIONS}
                customPresets={customPresets}
                onSavePreset={(preset) => setCustomPresets([...customPresets, preset])}
                onDeletePreset={(id) => setCustomPresets(customPresets.filter((p) => p.id !== id))}
              >
                {slotsPanel}
              </AdminLayoutSettings>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ) : null}
    </div>
  );
}

export { ShellDemo };

export default function AdminLayoutPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Admin Layout</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<AdminLayout
  layout="side"
  items={items}
  activeKey={activeKey}
  onNavigate={(key, item, event) => {
    event.preventDefault();
    navigate(key); // your own router
  }}
  logo={<Logo />}
  context={<TenantSwitcher />}
  actions={<UserMenu />}
  tabs={<PageTabs tabs={tabs} activeKey={activeKey} … />}
  footer="© 2026 Skein UI"
>
  <KeepAlive activeKey={activeKey} keepKeys={tabs.map((t) => t.key)}>
    <Page />
  </KeepAlive>
</AdminLayout>`}
      >
        <ShellDemo />
      </Example>

      <Example
        id="maximized"
        code={`<AdminLayout collapsed={collapsed} onCollapsedChange={setCollapsed} maximized={maximized} … />`}
      >
        <ShellDemo initialLayout="mix" switcher={false} showControls />
      </Example>

      <Example
        id="customize"
        code={`// Preferences kept in localStorage survive a reload (to keep them on a backend, useState and save in onValueChange)
const [settings, setSettings] = useAdminLayoutSettings("my-app.layout");

<AdminLayoutSettings value={settings} onValueChange={setSettings} />   // the panel's Export / Import gives JSON and code

// use exported settings directly: one prop
<AdminLayout
  settings={settings}            // layout, menuVariant, themeOverrides, showTabs
  themeScope="document"          // when overlays (portals) must follow too
  tabs={<PageTabs variant={settings.tabVariant} … />}
  …
/>`}
      >
        <ShellDemo customizable switcher={false} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="AdminLayout" />
      </section>

      <section id="nav" className="pg-example">
        <h3>{t("nav.title")}</h3>
        <p className="pg-desc">{t.rich("nav.description")}</p>
        <PropsTable
          first={t("nav.field")}
          rows={NAV_ITEM.map((r) => ({
            name: r.name,
            type: r.type,
            description: t.rich(`nav.${r.key}`),
          }))}
        />
      </section>

      <section id="helpers" className="pg-example">
        <h3>{t("helpers.title")}</h3>
        <PropsTable
          first={t("helpers.function")}
          rows={HELPERS.map((r) => ({
            name: r.name,
            type: r.type,
            description: t.rich(`helpers.${r.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}

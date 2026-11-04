import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { BREAKPOINTS } from "../../contract.ts";
import type {
  SidebarCollapsible,
  SidebarSide,
  SidebarVariant,
  SidebarWidth,
} from "../../contract.ts";
import { Drawer } from "../drawer/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

// ───────────── State ─────────────

export interface SidebarState {
  /** Expanded or collapsed (desktop). */
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Toggle expand / collapse on desktop, toggle the drawer on mobile. */
  toggle: () => void;
  /** When the screen is narrower than md (768px) the sidebar becomes a drawer. */
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

/** Inside `Sidebar.Provider`, read the sidebar's state and toggle it: `const { toggle, isMobile } = useSidebar()`. */
export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside <Sidebar.Provider>");
  return context;
}

/** Content inside (e.g. SideMenu) reads: whether it has collapsed to an icon-only narrow rail, and the sidebar's light / dark. */
const PanelContext = createContext<{ collapsed: boolean; theme?: "light" | "dark" }>({
  collapsed: false,
});

export function useSidebarPanel() {
  return useContext(PanelContext);
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 0.02}px)`);
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return mobile;
}

export interface SidebarProviderProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Controlled expanded state. */
  open?: boolean;
  /**
   * Initial state when uncontrolled.
   * @default true
   */
  defaultOpen?: boolean;
  /** Called with the new `open`; pass `open` as well to control it. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Width tier when expanded; the actual pixels come from the theme style's scale.
   * @default "md"
   */
  width?: SidebarWidth;
  /**
   * Keyboard shortcut for toggling (with Ctrl / ⌘); `false` disables it.
   * @default "b"
   */
  shortcut?: string | false;
}

/**
 * Sidebar shell: manages expand / collapse, the drawer state on mobile and the shortcut, and lays out `Sidebar` and `Sidebar.Inset` (main content) side by side.
 * Height is supplied from outside: put it in a container with a definite height (e.g. `100svh`), and the main content area scrolls itself.
 */
function SidebarProvider({
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  width = "md",
  shortcut = "b",
  children,
  ...rest
}: SidebarProviderProps) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = useIsMobile();

  const latest = useRef({ openProp, onOpenChange });
  latest.current = { openProp, onOpenChange };
  const openRef = useRef(open);
  openRef.current = open;

  const setOpen = useCallback((next: boolean) => {
    if (latest.current.openProp === undefined) setInner(next);
    latest.current.onOpenChange?.(next);
  }, []);
  const toggle = useCallback(
    () => (isMobile ? setOpenMobile((v) => !v) : setOpen(!openRef.current)),
    [isMobile, setOpen],
  );

  useEffect(() => {
    if (shortcut === false) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcut) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, toggle]);

  const value = useMemo<SidebarState>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      toggle,
      isMobile,
      openMobile,
      setOpenMobile,
    }),
    [open, setOpen, toggle, isMobile, openMobile],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div {...rest} data-slot="sidebar-provider" data-width={width}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ───────────── Sidebar body ─────────────

export interface SidebarProps extends Without<ComponentPropsWithoutRef<"aside">> {
  /**
   * On the left or right.
   * @default "left"
   */
  side?: SidebarSide;
  /**
   * Look: `sidebar` sits against the page edge (with a divider line between it and the content); `floating` is a floating rounded card;
   * `inset` blends the sidebar into the page background, and the main content (`Sidebar.Inset`) is a rounded card.
   * @default "sidebar"
   */
  variant?: SidebarVariant;
  /**
   * How it collapses: `offcanvas` slides the whole thing off screen; `icon` collapses to an icon-only narrow rail (the SideMenu inside collapses automatically);
   * `none` cannot collapse. When the screen is narrower than md it always becomes a drawer.
   * @default "offcanvas"
   */
  collapsible?: SidebarCollapsible;
  /** Light / dark. If not given, the theme style's own default is used (the antd theme style defaults to dark, the rest to light). */
  theme?: "light" | "dark";
  /** Name of the panel (`aside`) and of the mobile drawer; defaults to the locale's "Sidebar". */
  "aria-label"?: string;
}

/**
 * Sidebar: header (`Sidebar.Header`), scrollable content (`Sidebar.Content`, holding `SideMenu`), footer (`Sidebar.Footer`),
 * three looks x three collapse modes; on narrow screens it becomes a drawer. Expand / collapse is managed by the outer `Sidebar.Provider`.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  theme,
  "aria-label": labelProp,
  children,
  ...rest
}: SidebarProps) {
  const t = useLabels("sidebar");
  const label = labelProp ?? t.sidebar;
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const animate = useAfterFirstPaint();
  const collapsed = state === "collapsed";
  const panel = useMemo(
    () => ({ collapsed: collapsed && collapsible === "icon" && !isMobile, theme }),
    [collapsed, collapsible, isMobile, theme],
  );

  const inner = (mobile: boolean) => (
    <PanelContext.Provider value={mobile ? { collapsed: false, theme } : panel}>
      <aside
        {...rest}
        aria-label={label}
        data-slot="sidebar-inner"
        data-mobile={mobile ? "" : undefined}
        data-variant={variant}
        data-side={side}
        data-theme={theme}
      >
        {children}
      </aside>
    </PanelContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer side={side} open={openMobile} onOpenChange={setOpenMobile}>
        <Drawer.Content size="sm" closeButton={false} aria-label={label}>
          {inner(true)}
        </Drawer.Content>
      </Drawer>
    );
  }

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        data-state="expanded"
        data-collapsible="none"
        data-variant={variant}
        data-side={side}
      >
        {inner(false)}
      </div>
    );
  }

  return (
    <div
      data-slot="sidebar"
      data-state={state}
      data-animate={animate ? "" : undefined}
      data-collapsible={collapsed ? collapsible : undefined}
      data-variant={variant}
      data-side={side}
    >
      {/* Placeholder: keeps the sidebar's width in the layout, so expanding / collapsing pushes the main content */}
      <div data-slot="sidebar-gap" />
      {/* The panel itself: against the shell's edge, it slides out entirely when collapsed to offcanvas */}
      <div data-slot="sidebar-container" inert={collapsed && collapsible === "offcanvas"}>
        {inner(false)}
      </div>
    </div>
  );
}

/**
 * Returns true only after waiting two frames following mount: size changes between the first frame and styles being in place (e.g. `ConfigProvider` has not yet written the theme style attribute to `<html>`,
 * and the sidebar width jumps from one style's value to another) must not be animated; only later collapse / expand transitions.
 */
function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return ready;
}

// ───────────── Parts ─────────────

function SidebarHeader(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="sidebar-header" />;
}

function SidebarContent(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="sidebar-content" />;
}

function SidebarFooter(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="sidebar-footer" />;
}

/**
 * Text in the header / footer shown only while the sidebar is expanded: when collapsed to an icon rail it is visually hidden (screen readers still read it), leaving only the adjacent icon.
 * For example `<Sidebar.Label>Skein</Sidebar.Label>` placed after the logo icon.
 */
function SidebarLabel(props: Without<ComponentPropsWithoutRef<"span">>) {
  return <span {...props} data-slot="sidebar-label" />;
}

function SidebarInset(props: Without<ComponentPropsWithoutRef<"main">>) {
  return <main {...props} data-slot="sidebar-inset" />;
}

export interface SidebarTriggerProps extends Without<ComponentPropsWithoutRef<"button">> {
  /** Custom icon. */
  children?: ReactNode;
}

const PanelIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

/** Button that toggles the sidebar (collapse / expand on desktop, open / close the drawer on mobile); the name defaults to "Toggle sidebar". */
function SidebarTrigger({
  children,
  onClick,
  "aria-label": labelProp,
  ...rest
}: SidebarTriggerProps) {
  const t = useLabels("sidebar");
  const label = labelProp ?? t.toggle;
  const { toggle, open, isMobile, openMobile } = useSidebar();
  return (
    <button
      type="button"
      {...rest}
      data-slot="sidebar-trigger"
      aria-label={label}
      aria-expanded={isMobile ? openMobile : open}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
    >
      {children ?? <PanelIcon />}
    </button>
  );
}

/** Thin strip on the sidebar edge: a line appears on hover, and a click toggles expand / collapse. Mouse only; use `Sidebar.Trigger` for the keyboard. */
function SidebarRail({
  onClick,
  "aria-label": labelProp,
  ...rest
}: Without<ComponentPropsWithoutRef<"button">>) {
  const t = useLabels("sidebar");
  const label = labelProp ?? t.toggle;
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      tabIndex={-1}
      {...rest}
      data-slot="sidebar-rail"
      aria-label={label}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
    />
  );
}

Sidebar.Provider = SidebarProvider;
Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Footer = SidebarFooter;
Sidebar.Label = SidebarLabel;
Sidebar.Inset = SidebarInset;
Sidebar.Trigger = SidebarTrigger;
Sidebar.Rail = SidebarRail;

export { Sidebar };

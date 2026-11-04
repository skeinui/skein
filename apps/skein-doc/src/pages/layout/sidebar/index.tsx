import { Avatar, Sidebar, SideMenu, Text, useSidebar } from "@skeinui/ui";
import type { SideMenuEntry, SidebarProps } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** Rows of the parts / hook table; their descriptions are the page's `api.<key>` messages. */
const PARTS = [
  { key: "provider", name: "Sidebar.Provider", type: "div" },
  { key: "header", name: "Sidebar.Header / Content / Footer", type: "div" },
  { key: "label", name: "Sidebar.Label", type: "span" },
  { key: "inset", name: "Sidebar.Inset", type: "main" },
  { key: "trigger", name: "Sidebar.Trigger / Sidebar.Rail", type: "button" },
  {
    key: "useSidebar",
    name: "useSidebar()",
    type: "{ state, open, setOpen, toggle, isMobile, openMobile, setOpenMobile }",
  },
];

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "provider", name: "sidebar-provider" },
  { key: "sidebar", name: "sidebar" },
  { key: "gap", name: "sidebar-gap / sidebar-container" },
  { key: "inner", name: "sidebar-inner" },
  { key: "sections", name: "sidebar-header / sidebar-content / sidebar-footer" },
  { key: "label", name: "sidebar-label" },
  { key: "inset", name: "sidebar-inset" },
  { key: "trigger", name: "sidebar-trigger / sidebar-rail" },
];

const Icon = ({ d }: { d: string }) => (
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
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: <Icon d="M3 12 12 3l9 9M5 10v10h14V10" />,
  users: <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
  docs: <Icon d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />,
  settings: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12h2M3 12h2M12 3v2M12 19v2" />,
};

/** The demo menu, in the page's language. */
function useItems(): SideMenuEntry[] {
  const t = usePageT();
  return [
    { key: "dashboard", label: t("app.dashboard"), icon: ICONS.dashboard },
    {
      key: "users",
      label: t("app.users"),
      icon: ICONS.users,
      children: [
        { key: "users-list", label: t("app.allUsers") },
        { key: "users-roles", label: t("app.roles") },
      ],
    },
    { key: "docs", label: t("app.documents"), icon: ICONS.docs },
    { type: "divider", key: "d1" },
    { key: "settings", label: t("app.settings"), icon: ICONS.settings },
  ];
}

function Brand({ name }: { name: string }) {
  return (
    <Text strong>
      <span aria-hidden="true">◆ </span>
      <Sidebar.Label>{name}</Sidebar.Label>
    </Text>
  );
}

function Shell({
  height,
  label,
  children,
  ...sidebar
}: SidebarProps & { height?: number; label: string }) {
  const items = useItems();
  return (
    <div className="pg-shell" style={height ? { height } : undefined}>
      <Sidebar.Provider>
        <Sidebar aria-label={label} {...sidebar}>
          <Sidebar.Header>
            <Brand name="Skein" />
          </Sidebar.Header>
          <Sidebar.Content>
            <SideMenu aria-label={`${label} menu`} items={items} defaultSelectedKey="users-list" />
          </Sidebar.Content>
          <Sidebar.Footer>
            <Text tone="secondary">
              <Sidebar.Label>William · Admin</Sidebar.Label>
            </Text>
          </Sidebar.Footer>
          {sidebar.collapsible === "none" ? null : <Sidebar.Rail />}
        </Sidebar>
        <Sidebar.Inset>
          <div className="pg-shell-body">
            <Sidebar.Trigger />
            {children}
          </div>
        </Sidebar.Inset>
      </Sidebar.Provider>
    </div>
  );
}

/** A real demo of "Full example": same as the AppShell in the code below, except the outer container is replaced by the playground's fixed-height box, and the expanded state isn't written to localStorage. */
function useAppItems(): { items: SideMenuEntry[]; titles: Record<string, string> } {
  const t = usePageT();
  return {
    items: [
      { key: "dashboard", label: t("app.dashboard"), icon: ICONS.dashboard },
      {
        type: "group",
        key: "manage",
        label: t("app.management"),
        children: [
          {
            key: "users",
            label: t("app.users"),
            icon: ICONS.users,
            children: [
              { key: "users-all", label: t("app.allUsers") },
              { key: "users-roles", label: t("app.roles") },
            ],
          },
          { key: "docs", label: t("app.documents"), icon: ICONS.docs },
        ],
      },
      { type: "divider", key: "divider" },
      { key: "settings", label: t("app.settings"), icon: ICONS.settings },
    ],
    titles: {
      dashboard: t("app.dashboard"),
      "users-all": t("app.allUsers"),
      "users-roles": t("app.roles"),
      docs: t("app.documents"),
      settings: t("app.settings"),
    },
  };
}

function AppMenu({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { items } = useAppItems();
  return (
    <SideMenu
      aria-label="Main"
      items={items}
      selectedKey={selected}
      defaultOpenKeys={["users"]}
      onSelect={(key) => {
        onSelect(key);
        if (isMobile) setOpenMobile(false);
      }}
    />
  );
}

function AppShellDemo() {
  const t = usePageT();
  const { titles } = useAppItems();
  const [selected, setSelected] = useState("dashboard");
  return (
    <div className="pg-shell" style={{ height: 420 }}>
      <Sidebar.Provider>
        <Sidebar variant="inset" collapsible="icon" aria-label="Application shell">
          <Sidebar.Header>
            <Text strong>
              <span aria-hidden="true">◆ </span>
              <Sidebar.Label>Skein</Sidebar.Label>
            </Text>
          </Sidebar.Header>
          <Sidebar.Content>
            <AppMenu selected={selected} onSelect={setSelected} />
          </Sidebar.Content>
          <Sidebar.Footer>
            <Avatar alt="William" fallback="W" />
          </Sidebar.Footer>
          <Sidebar.Rail />
        </Sidebar>
        <Sidebar.Inset>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
            <Sidebar.Trigger />
            <h1 style={{ margin: 0, fontSize: 16 }}>{titles[selected]}</h1>
          </div>
          <div style={{ padding: "0 16px 16px" }}>{t("app.content")}</div>
        </Sidebar.Inset>
      </Sidebar.Provider>
    </div>
  );
}

const APP_CODE = `import { useState } from "react";
import { Avatar, Sidebar, SideMenu, Text, useSidebar } from "@skeinui/ui";
import type { SideMenuEntry } from "@skeinui/ui";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const items: SideMenuEntry[] = [
  { key: "dashboard", label: "Dashboard", icon: <Icon d="M3 12 12 3l9 9M5 10v10h14V10" /> },
  {
    type: "group",
    key: "manage",
    label: "Management",
    children: [
      {
        key: "users",
        label: "Users",
        icon: <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
        children: [
          { key: "users-all", label: "All users" },
          { key: "users-roles", label: "Roles" },
        ],
      },
      { key: "docs", label: "Documents", icon: <Icon d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" /> },
    ],
  },
  { type: "divider", key: "divider" },
  { key: "settings", label: "Settings", icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12h2M3 12h2M12 3v2M12 19v2" /> },
];

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "users-all": "All users",
  "users-roles": "Roles",
  docs: "Documents",
  settings: "Settings",
};

/** The menu: on mobile it also closes the drawer after a pick. useSidebar() only works inside Sidebar.Provider. */
function AppMenu({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SideMenu
      aria-label="Main"
      items={items}
      selectedKey={selected}
      defaultOpenKeys={["users"]}
      onSelect={(key) => {
        onSelect(key); // replace with your router's navigation, e.g. navigate(\`/\${key}\`)
        if (isMobile) setOpenMobile(false);
      }}
    />
  );
}

export function AppShell() {
  const [selected, setSelected] = useState("dashboard");
  // persist the expanded state yourself (kept across reloads); the library stores nothing
  const [open, setOpen] = useState(() => localStorage.getItem("sidebar_open") !== "false");

  return (
    // the shell's height comes from outside; the main area scrolls on its own
    <div style={{ height: "100svh" }}>
      <Sidebar.Provider
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          localStorage.setItem("sidebar_open", String(next));
        }}
      >
        <Sidebar variant="inset" collapsible="icon" aria-label="Application">
          <Sidebar.Header>
            <Text strong>
              <span aria-hidden="true">◆ </span>
              <Sidebar.Label>Skein</Sidebar.Label>
            </Text>
          </Sidebar.Header>
          <Sidebar.Content>
            <AppMenu selected={selected} onSelect={setSelected} />
          </Sidebar.Content>
          <Sidebar.Footer>
            <Avatar alt="William" fallback="W" />
          </Sidebar.Footer>
          <Sidebar.Rail />
        </Sidebar>

        <Sidebar.Inset>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
            <Sidebar.Trigger />
            <h1 style={{ margin: 0, fontSize: 16 }}>{TITLES[selected]}</h1>
          </div>
          <div style={{ padding: "0 16px 16px" }}>Page content</div>
        </Sidebar.Inset>
      </Sidebar.Provider>
    </div>
  );
}`;

function CollapsibleDemo() {
  const t = usePageT();
  const [mode, setMode] = useState<"offcanvas" | "icon">("icon");
  return (
    <div>
      <p style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["icon", "offcanvas"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </p>
      <Shell label={`Collapsible ${mode}`} collapsible={mode}>
        {t("collapsible.hint")}
      </Shell>
    </div>
  );
}

function FullDemo() {
  const t = usePageT();
  const items = useItems();
  return (
    <div className="pg-shell" style={{ height: 380 }}>
      <Sidebar.Provider>
        <Sidebar collapsible="icon" variant="inset" aria-label="Application">
          <Sidebar.Header>
            <Brand name="Skein" />
          </Sidebar.Header>
          <Sidebar.Content>
            <SideMenu aria-label="Application menu" items={items} defaultSelectedKey="dashboard" />
          </Sidebar.Content>
          <Sidebar.Footer>
            <Avatar alt="William" fallback="W" />
          </Sidebar.Footer>
        </Sidebar>
        <Sidebar.Inset>
          <div className="pg-shell-body">
            <Sidebar.Trigger />
            <h4 style={{ margin: "12px 0 4px" }}>{t("app.dashboard")}</h4>
            <Text tone="secondary">{t("usage.body")}</Text>
          </div>
        </Sidebar.Inset>
      </Sidebar.Provider>
    </div>
  );
}

export default function SidebarPage() {
  const t = usePageT();
  const items = useItems();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Sidebar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Sidebar, SideMenu } from "@skeinui/ui";

<Sidebar.Provider>
  <Sidebar variant="inset" collapsible="icon">
    <Sidebar.Header>…</Sidebar.Header>
    <Sidebar.Content>
      <SideMenu items={items} />
    </Sidebar.Content>
    <Sidebar.Footer>…</Sidebar.Footer>
  </Sidebar>
  <Sidebar.Inset>
    <Sidebar.Trigger />
    …
  </Sidebar.Inset>
</Sidebar.Provider>`}
      >
        <FullDemo />
      </Example>

      <Example id="app" code={APP_CODE}>
        <AppShellDemo />
      </Example>

      <Example
        id="variants"
        code={`<Sidebar variant="sidebar" />
<Sidebar variant="floating" />
<Sidebar variant="inset" />`}
      >
        <div className="pg-stack" style={{ width: "100%" }}>
          {(["sidebar", "floating", "inset"] as const).map((variant) => (
            <Shell key={variant} label={variant} variant={variant} collapsible="none" height={240}>
              <Text tone="secondary">variant=&quot;{variant}&quot;</Text>
            </Shell>
          ))}
        </div>
      </Example>

      <Example
        id="collapsible"
        code={`<Sidebar collapsible="icon" />
<Sidebar collapsible="offcanvas" />
<Sidebar collapsible="none" />`}
      >
        <CollapsibleDemo />
      </Example>

      <Example
        id="footer-trigger"
        code={`<Sidebar.Footer>
  <Sidebar.Trigger />
</Sidebar.Footer>`}
      >
        <div className="pg-shell">
          <Sidebar.Provider>
            <Sidebar collapsible="icon" aria-label="Footer trigger">
              <Sidebar.Content>
                <SideMenu
                  aria-label="Footer trigger menu"
                  items={items}
                  defaultSelectedKey="users-list"
                />
              </Sidebar.Content>
              <Sidebar.Footer>
                <Sidebar.Trigger />
              </Sidebar.Footer>
            </Sidebar>
            <Sidebar.Inset>
              <div className="pg-shell-body">
                <Text tone="secondary">{t("footer-trigger.body")}</Text>
              </div>
            </Sidebar.Inset>
          </Sidebar.Provider>
        </div>
      </Example>

      <Example id="side" code={`<Sidebar side="right" />`}>
        <Shell label="Right sidebar" side="right" variant="floating">
          <Text tone="secondary">side=&quot;right&quot;</Text>
        </Shell>
      </Example>

      <Example id="theme" code={`<Sidebar theme="dark" />`}>
        <div className="pg-stack" style={{ width: "100%" }}>
          <Shell label="Dark sidebar" theme="dark" height={240}>
            <Text tone="secondary">theme=&quot;dark&quot;</Text>
          </Shell>
          <Shell label="Light sidebar" theme="light" height={240}>
            <Text tone="secondary">theme=&quot;light&quot;</Text>
          </Shell>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Sidebar" />
        <ApiReference component="Sidebar.Provider" />
        <ApiReference component="Sidebar.Trigger" />
        <p className="pg-desc">{t("api.parts")}</p>
        <PropsTable
          first={t("api.part")}
          rows={PARTS.map((p) => ({
            name: p.name,
            type: p.type,
            description: t.rich(`api.${p.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}

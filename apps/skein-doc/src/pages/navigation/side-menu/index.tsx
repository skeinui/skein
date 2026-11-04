import { useState } from "react";
import { Button, Sidebar, SideMenu, Text } from "@skeinui/ui";
import type { SideMenuEntry } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The fields of a menu item; descriptions are the page's `api.item.<name>` messages. */
const ITEM_FIELDS = [
  { key: "key", name: "key", type: "string" },
  { key: "label", name: "label", type: "ReactNode" },
  { key: "icon", name: "icon", type: "ReactNode" },
  { key: "href", name: "href", type: "string" },
  { key: "flags", name: "disabled / danger", type: "boolean" },
  { key: "title", name: "title", type: "string" },
  { key: "children", name: "children", type: "SideMenuEntry[]" },
];

/** The styling hooks; descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "sidemenu" },
  { key: "item", name: "sidemenu-item / sidemenu-link" },
  { key: "submenu", name: "sidemenu-submenu / sidemenu-trigger / sidemenu-arrow" },
  { key: "panel", name: "sidemenu-panel / sidemenu-panel-inner" },
  { key: "parts", name: "sidemenu-group / group-title / divider / icon / label" },
];

const I = {
  dashboard: "M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z",
  users:
    "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 17c0-3 3-5 6-5s6 2 6 5M14 4a3 3 0 0 1 0 5M16 12c2 .5 3 2 3 5",
  gear: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4",
  doc: "M5 2h7l4 4v12H5zM12 2v4h4M8 10h5M8 13h5",
  shield: "M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5z",
  out: "M8 3H4v14h4M12 6l4 4-4 4M16 10H8",
};
const Icon = ({ d }: { d: keyof typeof I }) => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" aria-hidden="true">
    <path
      d={I[d]}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** The demo menu; labels are the page's `basic.items.<key>` messages. */
const menuItems = (t: (key: string) => string): SideMenuEntry[] => [
  { key: "dashboard", label: t("basic.items.dashboard"), icon: <Icon d="dashboard" /> },
  {
    key: "users",
    label: t("basic.items.users"),
    icon: <Icon d="users" />,
    children: [
      { key: "users-list", label: t("basic.items.users-list") },
      { key: "users-roles", label: t("basic.items.users-roles") },
      {
        key: "users-more",
        label: t("basic.items.users-more"),
        children: [
          { key: "users-groups", label: t("basic.items.users-groups") },
          { key: "users-invites", label: t("basic.items.users-invites") },
        ],
      },
    ],
  },
  {
    key: "content",
    label: t("basic.items.content"),
    icon: <Icon d="doc" />,
    children: [
      {
        type: "group",
        key: "g1",
        label: t("basic.items.g1"),
        children: [
          { key: "pages-all", label: t("basic.items.pages-all") },
          { key: "pages-new", label: t("basic.items.pages-new") },
        ],
      },
      {
        type: "group",
        key: "g2",
        label: t("basic.items.g2"),
        children: [{ key: "media-lib", label: t("basic.items.media-lib") }],
      },
    ],
  },
  { type: "divider" },
  { key: "security", label: t("basic.items.security"), icon: <Icon d="shield" /> },
  { key: "settings", label: t("basic.items.settings"), icon: <Icon d="gear" /> },
];

const Frame = ({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) => (
  <div className="pg-menu-frame" data-narrow={narrow ? "" : undefined}>
    {children}
  </div>
);

function Controlled() {
  const t = usePageT();
  const ITEMS = menuItems(t);
  const [selected, setSelected] = useState<string | null>("users-roles");
  const [open, setOpen] = useState<string[]>(["users"]);
  return (
    <div className="pg-stack">
      <Frame>
        <SideMenu
          aria-label="Controlled"
          items={ITEMS}
          selectedKey={selected}
          onSelect={(key) => setSelected(key)}
          openKeys={open}
          onOpenChange={setOpen}
        />
      </Frame>
      <Text tone="secondary">
        selected: <code>{selected}</code> · open: <code>{open.join(", ") || "—"}</code>
      </Text>
    </div>
  );
}

function CollapsedDemo() {
  const t = usePageT();
  const ITEMS = menuItems(t);
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="pg-stack pg-stack--start">
      <Button variant="outline" onClick={() => setCollapsed((c) => !c)}>
        {t(collapsed ? "collapsed.expand" : "collapsed.collapse")}
      </Button>
      <Frame narrow={collapsed}>
        <SideMenu
          aria-label="Collapsed"
          items={ITEMS}
          collapsed={collapsed}
          defaultSelectedKey="dashboard"
        />
      </Frame>
    </div>
  );
}

export default function SideMenuPage() {
  const t = usePageT();
  const ITEMS = menuItems(t);
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Side Menu</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { SideMenu } from "@skeinui/ui";

<SideMenu
  aria-label="Main"
  defaultSelectedKey="users-list"
  items={[
    { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { key: "users", label: "Users", icon: <UsersIcon />, children: [
      { key: "users-list", label: "All users" },
      { key: "users-roles", label: "Roles" },
    ]},
    { type: "divider" },
    { key: "settings", label: "Settings" },
  ]}
/>`}
      >
        <Frame>
          <SideMenu aria-label="Basic" items={ITEMS} defaultSelectedKey="users-list" />
        </Frame>
      </Example>

      <Example
        id="controlled"
        code={`<SideMenu items={items} selectedKey={key} onSelect={setKey} openKeys={open} onOpenChange={setOpen} />`}
      >
        <Controlled />
      </Example>

      <Example
        id="sidebar"
        code={`<Sidebar.Provider>
  <Sidebar collapsible="icon">
    <Sidebar.Content>
      <SideMenu items={items} defaultSelectedKey="dashboard" />
    </Sidebar.Content>
  </Sidebar>
  <Sidebar.Inset><Sidebar.Trigger /></Sidebar.Inset>
</Sidebar.Provider>`}
      >
        <div className="pg-shell">
          <Sidebar.Provider>
            <Sidebar collapsible="icon" aria-label="Demo sidebar">
              <Sidebar.Content>
                <SideMenu aria-label="Sidebar menu" items={ITEMS} defaultSelectedKey="users-list" />
              </Sidebar.Content>
            </Sidebar>
            <Sidebar.Inset>
              <div className="pg-shell-body">
                <Sidebar.Trigger />
              </div>
            </Sidebar.Inset>
          </Sidebar.Provider>
        </div>
      </Example>

      <Example id="collapsed" code={`<SideMenu items={items} collapsed={collapsed} />`}>
        <CollapsedDemo />
      </Example>

      <Example id="theme" code={`<SideMenu theme="dark" items={items} />`}>
        <div className="pg-grid-2">
          {(["light", "dark"] as const).map((theme) => (
            <Frame key={theme}>
              <SideMenu
                aria-label={theme}
                theme={theme}
                items={ITEMS}
                defaultSelectedKey="security"
              />
            </Frame>
          ))}
        </div>
      </Example>

      <Example
        id="links"
        code={`{ key: "docs", label: "Docs", href: "/docs" },
{ key: "billing", label: "Billing", disabled: true },
{ key: "logout", label: "Sign out", danger: true }`}
      >
        <Frame>
          <SideMenu
            aria-label="Links"
            defaultSelectedKey="docs"
            onSelect={(_, __, event) => event.preventDefault()}
            items={[
              { key: "docs", label: t("links.docs"), href: "#links", icon: <Icon d="doc" /> },
              {
                key: "billing",
                label: t("links.billing"),
                disabled: true,
                icon: <Icon d="shield" />,
              },
              { type: "divider" },
              { key: "logout", label: t("links.logout"), danger: true, icon: <Icon d="out" /> },
            ]}
          />
        </Frame>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="SideMenu" />
        <h4>SideMenuItem</h4>
        <p className="pg-desc">{t.rich("api.itemIntro")}</p>
        <PropsTable
          first={t("api.field")}
          rows={ITEM_FIELDS.map((f) => ({
            name: f.name,
            type: f.type,
            description: t.rich(`api.item.${f.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
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

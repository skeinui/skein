import { AdminLayout, Breadcrumb, PageTabs, matchNav, openTab, trailOf } from "@skeinui/ui";
import type { AdminNavItem } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { KeepAliveOutlet, usePagePath } from "./keep-alive-outlet";
import { usePageTitles, usePreferencesStore, useTabsStore } from "./store";

export interface AppLayoutProps {
  /** The menu; keys are route paths. */
  items: readonly AdminNavItem[];
  logo?: ReactNode;
  logoMark?: ReactNode;
  /** Next to the logo: a switcher of what the app works on (tenant, workspace…). */
  context?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

const textOf = (node: ReactNode) => (typeof node === "string" ? node : undefined);

/** AdminLayout wired to the router: the menu and the tabs follow the current path, and navigate on click. */
export function AppLayout({ items, logo, logoMark, context, actions, footer }: AppLayoutProps) {
  const pathname = usePagePath();
  const navigate = useNavigate();
  const layout = usePreferencesStore((s) => s.layout);
  const { tabs, versions, setTabs, refresh } = useTabsStore();
  const [maximized, setMaximized] = useState(false);
  const titles = usePageTitles((s) => s.titles);
  // The menu item of the page: itself, or for a page not in the menu (/users/42) the one it is under (/users)
  const match = matchNav(items, pathname);
  const trail = match ? trailOf(items, match.key) : null;
  const detail = match && match.key !== pathname;
  /** A tab's title: its menu item's label, else the title its page gave itself (`<Page title>`). */
  const titleOf = (key: string) => {
    const item = trailOf(items, key)?.at(-1);
    return {
      title: textOf(item?.label) ?? titles[key],
      icon: item?.icon ?? matchNav(items, key)?.icon,
    };
  };

  // Every page visited gets a tab (pages not in the menu too, e.g. a detail page)
  useEffect(() => {
    if (!layout.showTabs) return;
    const { tabs: open, setTabs: set } = useTabsStore.getState();
    set(openTab(open, { key: pathname, title: pathname }));
  }, [pathname, layout.showTabs]);

  // A page's own title is kept on its tab too: after a reload a background tab's page isn't rendered (so it
  // reports no title) until it is opened, and the tab keeps the name it had instead of its path
  useEffect(() => {
    const { tabs: open, setTabs: set } = useTabsStore.getState();
    if (open.some((tab) => titles[tab.key] && tab.title !== titles[tab.key]))
      set(open.map((tab) => (titles[tab.key] ? { ...tab, title: titles[tab.key] } : tab)));
  }, [titles]);

  const go = (to: string) => void navigate({ to });

  return (
    <AdminLayout
      settings={layout}
      // Theme colors and radius from the preferences apply to the whole page, overlays included
      themeScope="document"
      items={items}
      activeKey={match?.key ?? pathname}
      onNavigate={(key, _item, event) => {
        event.preventDefault();
        go(key);
      }}
      logo={logo}
      logoMark={logoMark}
      context={context}
      actions={actions}
      footer={footer}
      breadcrumb={
        trail ? (
          <Breadcrumb
            items={[
              ...trail.map((item) => ({
                icon: item.icon,
                label: item.label,
                // On a detail page its list is a way back
                onClick: detail && item === match ? () => go(item.key) : undefined,
              })),
              ...(detail ? [{ label: titles[pathname] ?? "…" }] : []),
            ]}
          />
        ) : undefined
      }
      tabs={
        layout.showTabs ? (
          <PageTabs
            variant={layout.tabVariant}
            // Titles come from the menu (or the page), so they follow the language
            tabs={tabs.map((tab) => {
              const { title, icon } = titleOf(tab.key);
              return { ...tab, title: title ?? tab.title, icon };
            })}
            activeKey={pathname}
            onActiveKeyChange={go}
            onTabsChange={setTabs}
          />
        ) : undefined
      }
      maximized={maximized}
      onMaximizedChange={setMaximized}
      onRefresh={() => refresh(pathname)}
    >
      <KeepAliveOutlet
        keepKeys={layout.showTabs ? tabs.map((t) => t.key) : [pathname]}
        versions={versions}
      />
    </AdminLayout>
  );
}

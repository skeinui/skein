import { Button, Menu } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useEffect } from "react";
import type { PageTab } from "@skeinui/ui";
import { settings } from "@/settings";
import { usePagePath, useTabsStore } from "@/skein-shell";
import { useTenantSwitcherTranslation } from "./locales";
import { pageOf, withoutTenant } from "./tenant-path";
import { useTenant } from "./use-tenant";

/**
 * Next to the logo (AdminLayout's `context`): which tenant the app works on. The tenant is in the address
 * (/<tenant>/orders); picking another goes to the same page of that tenant.
 */
export function TenantSwitcher() {
  const { t } = useTenantSwitcherTranslation();
  const navigate = useNavigate();
  const pathname = usePagePath();
  const { tenantId, inAddress, tenants } = useTenant();
  const current = tenants.find((item) => item.id === tenantId);

  // The open tabs follow the tenant: /acme/orders → /globex/orders; a detail page's tab (/acme/users/42) closes.
  // This effect runs before the layout's (a child's run first), which would open the new path as one more tab
  useEffect(() => {
    if (!inAddress || !tenantId) return;
    const tenant = tenantId;
    const ids = tenants.map((item) => item.id);
    const { tabs, setTabs } = useTabsStore.getState();
    const next: PageTab[] = [];
    for (const tab of tabs) {
      let key = tab.key;
      if (!key.startsWith(`/${tenant}/`)) {
        const path = withoutTenant(key, ids);
        if (pageOf(path) !== path) continue;
        key = `/${tenant}${path}`;
      }
      if (!next.some((item) => item.key === key)) next.push({ ...tab, key });
    }
    if (next.some((tab, i) => tab.key !== tabs[i]?.key) || next.length !== tabs.length)
      setTabs(next);
  }, [inAddress, tenantId, tenants]);

  const switchTo = (id: string) => {
    if (id === tenantId) return;
    // The same page (a detail page's list) of the other tenant
    const page = pageOf(
      withoutTenant(
        pathname,
        tenants.map((item) => item.id),
      ),
    );
    void navigate({ to: `/${id}${page ?? settings.homePath}` });
  };

  return (
    // At least 2rem high in every theme style (styles/index.css, .tenant-switcher)
    <span className="tenant-switcher">
      <Menu>
        <Menu.Trigger
          render={<Button size="sm" variant="outline" color="neutral" fullWidth />}
          aria-label={t("switchTenant")}
        >
          <Building2 size={14} />
          <span style={{ flex: 1, textAlign: "start" }}>{current?.name ?? t("loading")}</span>
          <ChevronsUpDown size={14} />
        </Menu.Trigger>
        {/* As wide as the switcher at least (styles/index.css) */}
        <Menu.Content id="tenant-switcher-menu" align="start">
          {tenants.map((item) => (
            <Menu.Item key={item.id} onClick={() => switchTo(item.id)}>
              {item.id === tenantId ? <Check size={14} /> : <span style={{ width: 14 }} />}
              {item.name}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu>
    </span>
  );
}

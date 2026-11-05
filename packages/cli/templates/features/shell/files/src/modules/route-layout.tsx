import { AppLayout } from "@/skein-shell";
import { settings } from "@/settings";
import { PreferencesButton } from "./app-preferences";
{{#if tenant}}
import { TenantSwitcher } from "./tenant-switcher";
{{/if}}
import { useNavMenus } from "./use-nav-menus";
import { UserMenu } from "./user-menu";

const logoMark = <img src="/favicon.svg" alt="" width={24} height={24} />;

/** The layout of every signed-in page (routes/_auth.tsx): the shell plus this app's own parts. */
export function RouteLayout() {
  const items = useNavMenus();
  return (
    <AppLayout
      items={items}
      logoMark={logoMark}
      logo={
        <span className="app-logo">
          {logoMark}
          {settings.appName}
        </span>
      }
{{#if tenant}}
      context={<TenantSwitcher />}
{{/if}}
      actions={
        <>
          <PreferencesButton />
          <UserMenu />
        </>
      }
      footer={
        <>
          {settings.footer}
          {settings.poweredBy ? (
            <>
              {" · "}
              <span className="app-powered">
                Powered by{" "}
                <a href="https://skeinui.com" target="_blank" rel="noreferrer">
                  Skein UI
                </a>
              </span>
            </>
          ) : null}
        </>
      }
    />
  );
}

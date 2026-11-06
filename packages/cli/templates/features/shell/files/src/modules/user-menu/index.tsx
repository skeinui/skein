import { Avatar, Button, Menu } from "@skeinui/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, Languages, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { fetchProfile, logout } from "@/pages/login/api";
import { usePreferencesStore, useTabsStore } from "@/skein-shell";
import { useAuthStore } from "@/store/auth-store";
import { useUserMenuTranslation } from "./locales";

const MODES = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
] as const;

/** The avatar menu: who is signed in, language, light / dark, sign out. */
export function UserMenu() {
  const { t, i18n } = useUserMenuTranslation();
  // The user saved at sign-in shows at once; the profile then brings what changed since (name, avatar…)
  const storedUser = useAuthStore((s) => s.user);
  const { data: profile } = useQuery({ queryKey: ["auth", "profile"], queryFn: fetchProfile });
  const user = profile ?? storedUser;
  const mode = usePreferencesStore((s) => s.mode);
  const setMode = usePreferencesStore((s) => s.setMode);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = useMutation({
    mutationFn: logout,
    onSettled: () => {
      useAuthStore.getState().reset();
      // What was loaded belongs to the user who signed out
      queryClient.clear();
      useTabsStore.getState().setTabs([]);
      void navigate({ to: "/login" });
    },
  });

  return (
    // Sized in styles/index.css (.user-menu): the button is the avatar's size
    <span className="user-menu">
      <Menu>
        <Menu.Trigger
          render={<Button variant="ghost" color="neutral" size="sm" radius="full" iconOnly />}
          aria-label={t("account")}
        >
          <Avatar
            src={user?.avatar}
            alt={user?.name ?? ""}
            fallback={user?.name.slice(0, 1).toUpperCase() ?? "?"}
          />
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Group>
            <Menu.GroupLabel>
              {user?.name} · {user?.email}
            </Menu.GroupLabel>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>
              <Languages size={14} /> {t("language")}
            </Menu.GroupLabel>
            {LANGUAGES.map((lang) => (
              <Menu.Item key={lang.id} onClick={() => void i18n.changeLanguage(lang.id)}>
                {i18n.language.startsWith(lang.id) ? (
                  <Check size={14} />
                ) : (
                  <span style={{ width: 14 }} />
                )}
                {lang.label}
              </Menu.Item>
            ))}
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>{t("appearance")}</Menu.GroupLabel>
            {MODES.map(({ id, icon: Icon }) => (
              <Menu.Item key={id} onClick={() => setMode(id)}>
                {mode === id ? <Check size={14} /> : <Icon size={14} />}
                {t(`mode.${id}`)}
              </Menu.Item>
            ))}
          </Menu.Group>
          <Menu.Separator />
          <Menu.Item color="danger" onClick={() => signOut.mutate()}>
            <LogOut size={14} />
            {t("signOut")}
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </span>
  );
}

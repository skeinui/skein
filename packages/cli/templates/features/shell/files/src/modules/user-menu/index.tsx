import { Avatar, Button, Menu } from "@skeinui/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { fetchProfile, logout } from "@/pages/login/api";
import { useTabsStore } from "@/skein-shell";
import { useAuthStore } from "@/store/auth-store";
import { useUserMenuTranslation } from "./locales";

/** The avatar menu: who is signed in, sign out. Language and light / dark are toolbar tools (modules/toolbar). */
export function UserMenu() {
  const { t } = useUserMenuTranslation();
  // The user saved at sign-in shows at once; the profile then brings what changed since (name, avatar…)
  const storedUser = useAuthStore((s) => s.user);
  const signedIn = useAuthStore((s) => Boolean(s.token));
  // Not once the session is gone (signing out clears the cache, which would ask again without a token)
  const { data: profile } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: fetchProfile,
    enabled: signedIn,
  });
  const user = profile ?? storedUser;
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
          <Menu.Item color="danger" onClick={() => signOut.mutate()}>
            <LogOut size={14} />
            {t("signOut")}
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </span>
  );
}

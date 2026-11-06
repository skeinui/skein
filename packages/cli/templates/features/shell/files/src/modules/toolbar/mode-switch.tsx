import { Button, Menu } from "@skeinui/ui";
import { Monitor, Moon, Sun } from "lucide-react";
import { usePreferencesStore } from "@/skein-shell";
import { useToolbarTranslation } from "./locales";

const MODES = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
] as const;

/** Built-in tool "mode": light, dark or following the system; the button shows the current one, the menu checks it. */
export function ModeSwitch() {
  const { t } = useToolbarTranslation();
  const mode = usePreferencesStore((s) => s.mode);
  const setMode = usePreferencesStore((s) => s.setMode);
  const Current = MODES.find((m) => m.id === mode)?.icon ?? Monitor;
  return (
    <Menu>
      <Menu.Trigger
        render={<Button variant="ghost" color="neutral" size="sm" iconOnly />}
        aria-label={t("appearance")}
      >
        <Current size={16} />
      </Menu.Trigger>
      <Menu.Content align="end">
        {MODES.map(({ id, icon: Icon }) => (
          <Menu.CheckboxItem
            key={id}
            checked={mode === id}
            onCheckedChange={() => setMode(id)}
            closeOnClick
          >
            <Icon size={14} />
            {t(`mode.${id}`)}
          </Menu.CheckboxItem>
        ))}
      </Menu.Content>
    </Menu>
  );
}

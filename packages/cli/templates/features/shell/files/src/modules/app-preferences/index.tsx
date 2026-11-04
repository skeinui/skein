import { AdminLayoutSettings, Button, Drawer } from "@skeinui/ui";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { resolveThemeStyle, themeStyleOptions, usePreferencesStore } from "@/skein-shell";
import { usePreferencesTranslation } from "./locales";

/** A button that opens the preferences drawer: theme style (when settings lists several), layout, menu style, tabs, colors, radius, density. */
export function PreferencesButton() {
  const { t } = usePreferencesTranslation();
  const [open, setOpen] = useState(false);
  const layout = usePreferencesStore((s) => s.layout);
  const setLayout = usePreferencesStore((s) => s.setLayout);
  const reset = usePreferencesStore((s) => s.reset);
  return (
    <>
      <Button variant="ghost" color="neutral" size="sm" iconOnly aria-label={t("title")} onClick={() => setOpen(true)}>
        <Settings2 size={16} />
      </Button>
      <Drawer open={open} onOpenChange={setOpen} side="right">
        <Drawer.Content size="md">
          <Drawer.Title>{t("title")}</Drawer.Title>
          <Drawer.Description>{t("description")}</Drawer.Description>
          <Drawer.Body>
            <AdminLayoutSettings
              value={{ ...layout, themeStyle: resolveThemeStyle(layout.themeStyle) }}
              onValueChange={setLayout}
              themeStyles={themeStyleOptions}
            >
              <Button variant="outline" color="neutral" fullWidth onClick={reset}>
                {t("reset")}
              </Button>
            </AdminLayoutSettings>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </>
  );
}

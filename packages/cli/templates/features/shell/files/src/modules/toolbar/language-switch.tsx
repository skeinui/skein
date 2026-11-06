import { Button, Menu } from "@skeinui/ui";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { FLAGS } from "./flags";
import { useToolbarTranslation } from "./locales";

/** Built-in tool "language": the app's languages with their flags (flags.tsx), the current one checked (the check and its look are the theme style's). */
export function LanguageSwitch() {
  const { t, i18n } = useToolbarTranslation();
  return (
    <Menu>
      <Menu.Trigger
        render={<Button variant="ghost" color="neutral" size="sm" iconOnly />}
        aria-label={t("language")}
      >
        <Globe size={16} />
      </Menu.Trigger>
      <Menu.Content align="end">
        {LANGUAGES.map((lang) => (
          <Menu.CheckboxItem
            key={lang.id}
            checked={i18n.language.startsWith(lang.id)}
            onCheckedChange={() => void i18n.changeLanguage(lang.id)}
            closeOnClick
          >
            <span className="app-flag">{FLAGS[lang.id]}</span>
            {lang.label}
          </Menu.CheckboxItem>
        ))}
      </Menu.Content>
    </Menu>
  );
}

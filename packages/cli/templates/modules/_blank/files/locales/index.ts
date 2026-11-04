{{#if i18n}}
import { useModuleTranslation } from "@/lib/use-module-translation";
import en from "./messages/en.json";
import zh from "./messages/zh.json";

export function use{{Name}}Translation() {
  return useModuleTranslation("{{ns}}", { en, zh });
}
{{/if}}

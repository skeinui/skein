import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

type Messages = Record<string, Record<string, unknown>>;

const registered = new Set<string>();

/**
 * Translations of one page or module: its `locales/messages/{zh,en}.json` become the namespace `ns`,
 * registered the first time it is used, so each page carries its own text.
 */
export function useModuleTranslation(ns: string, messages: Messages) {
  if (!registered.has(ns)) {
    for (const [lng, resources] of Object.entries(messages)) {
      if (!i18n.hasResourceBundle(lng, ns)) i18n.addResourceBundle(lng, ns, resources);
    }
    registered.add(ns);
  }
  return useTranslation(ns);
}

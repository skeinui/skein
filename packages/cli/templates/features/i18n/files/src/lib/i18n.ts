import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export const LANGUAGES = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Chinese unless the user picked another language (remembered in localStorage)
    fallbackLng: "zh",
    supportedLngs: LANGUAGES.map((l) => l.id),
    load: "languageOnly",
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "{{storageKey}}-lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    // Pages and modules add their own namespaces (useModuleTranslation)
    resources: { zh: { translation: {} }, en: { translation: {} } },
  });

const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = lng.startsWith("zh") ? "zh-CN" : "en";
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;

import { useSettings } from "@/site/settings.ts";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

type Section = "shell" | "showcase";

/**
 * The texts of the shell demo (`shell.*`) and of the component overview inside it (`showcase.*`), picked by the
 * settings' language rather than by the docs page's message context: `ShellDemo` also renders in the full-window
 * frame (`/__admin-layout`), outside any docs page.
 */
export function useShellT(section: Section) {
  const messages = (useSettings().lang === "zh-CN" ? zh : en)[section] as Record<string, string>;
  const fallback = en[section] as Record<string, string>;
  return (key: string) => messages[key] ?? fallback[key] ?? key;
}

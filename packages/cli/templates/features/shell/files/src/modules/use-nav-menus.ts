import type { AdminNavItem } from "@skeinui/ui";
import { useQuery } from "@tanstack/react-query";
import { createElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { pageTree } from "@/lib/page-meta";
import type { PageEntry } from "@/lib/page-meta";
import { fetchUserMenus } from "@/pages/login/api";
import { settings } from "@/settings";

function toItems(
  entries: PageEntry[],
  lang: "zh" | "en",
  allowed: Set<string> | null,
): AdminNavItem[] {
  return entries.flatMap((entry): AdminNavItem[] => {
    const { meta, path } = entry;
    if (meta.hidden) return [];
    const children = toItems(entry.children, lang, allowed);
    // A group without a visible page is left out; so is a page the user may not open
    if (meta.isGroup && children.length === 0) return [];
    if (!meta.isGroup && allowed && !allowed.has(path)) return [];
    return [
      {
        key: path,
        label: meta.label[lang],
        icon: meta.icon ? createElement(meta.icon, { size: 16 }) : undefined,
        ...(meta.isGroup ? { children } : { href: path }),
      },
    ];
  });
}

/** The menu: every page with a _meta.ts, filtered by the API when `settings.menuPermission` is on. */
export function useNavMenus(): AdminNavItem[] {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("zh") ? "zh" : "en";
  const { data: allowedPaths } = useQuery({
    queryKey: ["user", "menus"],
    queryFn: fetchUserMenus,
    enabled: settings.menuPermission,
  });
  return useMemo(() => {
    if (settings.menuPermission && !allowedPaths) return [];
    return toItems(pageTree(), lang, allowedPaths ? new Set(allowedPaths) : null);
  }, [lang, allowedPaths]);
}

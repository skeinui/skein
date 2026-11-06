import type { AdminNavItem, CommandEntry, CommandItem } from "@skeinui/ui";
import { Button, CommandDialog } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavMenus } from "../use-nav-menus";
import { useToolbarTranslation } from "./locales";

const textOf = (label: AdminNavItem["label"]) => (typeof label === "string" ? label : "");

/** The pages of a menu branch, deepest first flattened; each also matches its groups' names and its path. */
function pagesOf(items: readonly AdminNavItem[], trail: string[] = []): CommandItem[] {
  return items.flatMap((item) =>
    item.children
      ? pagesOf(item.children, [...trail, textOf(item.label)])
      : [
          {
            key: item.key,
            label: textOf(item.label),
            icon: item.icon,
            keywords: [...trail, item.key],
          },
        ],
  );
}

/**
 * Built-in tool "search": a command palette of the menu's pages (⌘K / Ctrl+K anywhere, or the button), each
 * group of the menu a group of it; picking one opens it.
 */
export function SearchTool() {
  const { t } = useToolbarTranslation();
  const items = useNavMenus();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const entries = useMemo<CommandEntry[]>(
    () =>
      items.map((item) =>
        item.children
          ? {
              type: "group",
              key: item.key,
              label: textOf(item.label),
              items: pagesOf(item.children, [textOf(item.label)]),
            }
          : pagesOf([item])[0],
      ),
    [items],
  );
  return (
    <>
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        iconOnly
        aria-label={t("search")}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
      >
        <Search size={16} />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        hotkey="mod+k"
        title={t("search")}
        placeholder={t("searchPlaceholder")}
        emptyText={t("searchEmpty")}
        items={entries}
        onSelect={(key) => void navigate({ to: key })}
      />
    </>
  );
}

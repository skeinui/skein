import { Button, Switch } from "@skeinui/ui";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useToolbarTranslation } from "./locales";
import { useToolbarStore } from "./store";
import { TOOLS } from "./tools";

/** A tool this app has (`in` would take `constructor` for one). */
const isTool = (id: unknown): id is string => typeof id === "string" && Object.hasOwn(TOOLS, id);

/**
 * The toolbar's part of the drawer's Export / Import: spread into `AdminLayoutSettings` (`extra`, `onExtraChange`).
 * The export has the shown tools in order under `extra.toolbar`; what an import brings is checked: tools this app
 * has, each once.
 */
export function useToolbarExtra() {
  const header = useToolbarStore((s) => s.header);
  const setHeader = useToolbarStore((s) => s.setHeader);
  return {
    extra: { toolbar: header.filter(isTool) },
    onExtraChange: (extra: Record<string, unknown>) => {
      if (Array.isArray(extra.toolbar)) setHeader([...new Set(extra.toolbar.filter(isTool))]);
    },
  };
}

/**
 * The preferences drawer's section for the header toolbar: every tool of `TOOLS` with a switch, the shown ones
 * in order with buttons to move them. The choice is `useToolbarStore`; "Reset" in the drawer brings back
 * `settings.toolbar.header`.
 */
export function ToolbarPreferences() {
  const { t } = useToolbarTranslation();
  const stored = useToolbarStore((s) => s.header);
  const setHeader = useToolbarStore((s) => s.setHeader);
  // A tool that was taken out of TOOLS since the choice was saved is not listed
  const shown = stored.filter(isTool);
  const hidden = Object.keys(TOOLS).filter((id) => !shown.includes(id));
  const move = (index: number, by: -1 | 1) => {
    const next = [...shown];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setHeader(next);
  };
  const name = (id: string) => t(`tools.${id}`, { defaultValue: id });
  return (
    <section className="tool-prefs">
      <h4>{t("preferences.title")}</h4>
      <p>{t("preferences.hint")}</p>
      {[...shown, ...hidden].map((id) => {
        const index = shown.indexOf(id);
        const on = index >= 0;
        return (
          <div key={id} className="tool-prefs-row">
            <Switch
              aria-label={name(id)}
              checked={on}
              onCheckedChange={(checked) =>
                setHeader(checked ? [...shown, id] : shown.filter((x) => x !== id))
              }
            />
            <span className="tool-prefs-name">{name(id)}</span>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              disabled={!on || index === 0}
              aria-label={t("preferences.up", { tool: name(id) })}
              onClick={() => move(index, -1)}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              disabled={!on || index === shown.length - 1}
              aria-label={t("preferences.down", { tool: name(id) })}
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={14} />
            </Button>
          </div>
        );
      })}
    </section>
  );
}

import { Fragment } from "react";
import { settings } from "@/settings";
import { useToolbarStore } from "./store";
import { TOOLS } from "./tools";

/**
 * The tools of a toolbar, in order: the header's are what the user chose in the preferences (`settings.toolbar.header`
 * until then), the sign-in page's `settings.toolbar.login`. Their icons are drawn like the side menu's by the
 * theme style (in AdminLayout's actions).
 */
export function Toolbar({ place }: { place: keyof typeof settings.toolbar }) {
  const chosen = useToolbarStore((s) => s.header);
  const ids = place === "header" ? chosen : settings.toolbar[place];
  return (
    <span className="app-toolbar">
      {ids.map((id) => {
        const Tool = TOOLS[id];
        if (!Tool) {
          if (import.meta.env.DEV)
            console.warn(`settings.toolbar.${place}: no tool "${id}" in TOOLS`);
          return null;
        }
        return (
          <Fragment key={id}>
            <Tool />
          </Fragment>
        );
      })}
    </span>
  );
}

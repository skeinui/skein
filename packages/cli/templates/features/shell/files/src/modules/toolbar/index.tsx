import { Fragment } from "react";
import { settings } from "@/settings";
import { TOOLS } from "./tools";

/**
 * The tools `settings.toolbar[place]` lists, in its order: in the header, or on the sign-in page. Their icons are
 * drawn like the side menu's by the theme style (in AdminLayout's actions).
 */
export function Toolbar({ place }: { place: keyof typeof settings.toolbar }) {
  return (
    <span className="app-toolbar">
      {settings.toolbar[place].map((id) => {
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

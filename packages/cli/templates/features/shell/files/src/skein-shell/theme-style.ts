import { useEffect, useState } from "react";
import { settings } from "@/settings";

const loading = new Map<string, Promise<unknown>>();

/** `id` when settings.themeStyles lists it, else the default (a stored choice may have been removed since). */
export const resolveThemeStyle = (id?: string) =>
  id && id in settings.themeStyles ? id : settings.themeStyle;

/** Loads a theme style's CSS, once. */
export function loadThemeStyle(id: string) {
  let pending = loading.get(id);
  if (!pending) {
    pending = settings.themeStyles[id].load();
    loading.set(id, pending);
  }
  return pending;
}

/** The theme style to put on <html>: it switches to `wanted` once that CSS has loaded, so nothing shows unstyled. */
export function useThemeStyle(wanted: string) {
  const [active, setActive] = useState(wanted);
  useEffect(() => {
    let current = true;
    void loadThemeStyle(wanted).then(() => current && setActive(wanted));
    return () => {
      current = false;
    };
  }, [wanted]);
  return active;
}

/** The choices of the preferences drawer: only when there is more than one. */
export const themeStyleOptions =
  Object.keys(settings.themeStyles).length > 1
    ? Object.entries(settings.themeStyles).map(([id, { label }]) => ({ id, label }))
    : undefined;

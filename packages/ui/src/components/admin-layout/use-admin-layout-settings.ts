import { useCallback, useState } from "react";
import { DEFAULT_ADMIN_LAYOUT_SETTINGS, normalizeSettings } from "./settings.ts";
import type { AdminLayoutSettingsValue } from "./settings.ts";

function read(key: string | undefined, defaults: AdminLayoutSettingsValue) {
  if (!key || typeof localStorage === "undefined") return defaults;
  try {
    const text = localStorage.getItem(key);
    return text ? normalizeSettings(JSON.parse(text), defaults) : defaults;
  } catch {
    return defaults;
  }
}

/**
 * Manages a layout settings object and (optionally) stores it in localStorage, so it survives a refresh.
 * Data read back is normalized into valid settings (invalid fields are filled from `defaults`); when storage is unavailable (private mode...) it is kept in memory only.
 * Returns `[settings, update, reset]`; the settings can be passed straight to `AdminLayoutSettings`'s `value` and `AdminLayout`'s `settings`.
 * To store in a backend, don't use it: use your own `useState` and save in `onValueChange`.
 */
export function useAdminLayoutSettings(
  storageKey?: string,
  defaults: AdminLayoutSettingsValue = DEFAULT_ADMIN_LAYOUT_SETTINGS,
) {
  const [value, setValue] = useState(() => read(storageKey, defaults));
  const update = useCallback(
    (next: AdminLayoutSettingsValue) => {
      setValue(next);
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // When storage is unavailable, keep it in memory only
      }
    },
    [storageKey],
  );
  const reset = useCallback(() => {
    setValue(defaults);
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Same as above
    }
  }, [defaults, storageKey]);
  return [value, update, reset] as const;
}

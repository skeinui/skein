import { useState } from "react";

/**
 * Whether a table keeps its header fixed and scrolls only its rows, for the toggle of `TableTools`: `initial` until the user chooses, then what
 * they chose, remembered per `key` in this browser (`localStorage`; when it is blocked the choice lasts until the page is closed).
 * Returns `[fixed, setFixed]`.
 */
export function useFixedHeader(key: string, initial = true) {
  const storageKey = `table-fixed-header:${key}`;
  const [fixed, setFixed] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? initial : saved === "1";
    } catch {
      return initial;
    }
  });
  const change = (next: boolean) => {
    setFixed(next);
    try {
      localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // storage can be blocked: the choice then lasts until the page is closed
    }
  };
  return [fixed, change] as const;
}

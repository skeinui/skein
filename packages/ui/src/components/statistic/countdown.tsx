import { useEffect, useRef, useState } from "react";
import { StatisticBase } from "./statistic.tsx";
import type { StatisticProps } from "./statistic.tsx";

export interface StatisticCountdownProps extends Omit<
  StatisticProps,
  "value" | "format" | "precision" | "groupSeparator" | "decimalSeparator"
> {
  /** Deadline: a millisecond timestamp, a Date, or a string parseable by `new Date()`. */
  deadline: number | Date | string;
  /**
   * Display format. Supports D (days) H (hours) m (minutes) s (seconds) S (milliseconds); repeated letters mean zero padding (HH, SSS),
   * text in square brackets is output as is ("D [days] HH:mm"). Larger units missing from the format are folded into smaller ones (without D, days are counted into H).
   * @default "HH:mm:ss"
   */
  format?: string;
  /** Refresh interval (milliseconds); default 1000, or 50 when the format contains S. */
  interval?: number;
  /** Called once when the countdown reaches 0 (also called if it has already expired on mount). */
  onFinish?: () => void;
  /** Called on every refresh with the remaining milliseconds. */
  onChange?: (remaining: number) => void;
}

const UNITS = [
  ["D", 86_400_000],
  ["H", 3_600_000],
  ["m", 60_000],
  ["s", 1000],
  ["S", 1],
] as const;

const toTime = (deadline: number | Date | string) =>
  typeof deadline === "number" ? deadline : new Date(deadline).getTime();

/** Splits the remaining milliseconds according to the format: only units that appear in the format are subtracted, so missing larger units are folded into smaller ones. */
export function formatCountdown(ms: number, format: string): string {
  const parts = format.split(/(\[[^\]]*\])/);
  const present = new Set(
    parts.filter((p) => !p.startsWith("[")).flatMap((p) => p.match(/[DHmsS]/g) ?? []),
  );
  let rest = Math.max(0, Math.floor(ms));
  const values: Record<string, number> = {};
  for (const [token, size] of UNITS) {
    if (!present.has(token)) continue;
    values[token] = Math.floor(rest / size);
    rest -= values[token]! * size;
  }
  return parts
    .map((part) =>
      part.startsWith("[")
        ? part.slice(1, -1)
        : part.replace(/D+|H+|m+|s+|S+/g, (run) =>
            String(values[run[0]!] ?? 0).padStart(run.length, "0"),
          ),
    )
    .join("");
}

/** ISO 8601 duration, for <time datetime>, readable by both screen readers and machines. */
const isoDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `PT${Math.floor(total / 3600)}H${Math.floor((total % 3600) / 60)}M${total % 60}S`;
};

/**
 * Countdown: a kind of Statistic whose value refreshes every so often. The value is a `<time>` inside `role="timer"` (which implies aria-live="off",
 * so screen readers do not read it out every second). The browser throttles when the page is hidden, and it is recomputed immediately when visible again, so it does not drift.
 */
export function StatisticCountdown({
  deadline,
  format = "HH:mm:ss",
  interval,
  onFinish,
  onChange,
  ...rest
}: StatisticCountdownProps) {
  const target = toTime(deadline);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  const finished = useRef(false);
  const callbacks = useRef({ onFinish, onChange });
  callbacks.current = { onFinish, onChange };
  const step = interval ?? (/S/.test(format.replace(/\[[^\]]*\]/g, "")) ? 50 : 1000);

  useEffect(() => {
    finished.current = false;
    const tick = () => {
      const left = Math.max(0, target - Date.now());
      setRemaining(left);
      callbacks.current.onChange?.(left);
      if (left === 0 && !finished.current) {
        finished.current = true;
        callbacks.current.onFinish?.();
        return true;
      }
      return left === 0;
    };
    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, step);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [target, step]);

  return (
    <StatisticBase
      {...rest}
      value={remaining}
      format={(ms) => (
        <time role="timer" dateTime={isoDuration(Number(ms))} suppressHydrationWarning>
          {formatCountdown(Number(ms), format)}
        </time>
      )}
    />
  );
}

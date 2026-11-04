import { StatisticCountdown } from "./countdown.tsx";
import { StatisticBase } from "./statistic.tsx";

/**
 * Statistic: a key number on a dashboard: a small `title`, a large `value` (formatted with `precision` and separators,
 * optional `prefix` / `suffix`) and an optional `description`. `Statistic.Countdown` counts down to a time.
 * For a progress toward a goal use Progress; for a tag-like status use Badge.
 */
export const Statistic = Object.assign(StatisticBase, { Countdown: StatisticCountdown });
export type { StatisticProps } from "./statistic.tsx";
export type { StatisticCountdownProps } from "./countdown.tsx";
export { formatCountdown } from "./countdown.tsx";
export { formatNumber } from "./statistic.tsx";

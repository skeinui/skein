/**
 * Times are represented as "HH:mm" or "HH:mm:ss" (24-hour) strings, which are serializable and involve no time zone.
 * The 12-hour clock only affects display and the selection panel; the value is always 24-hour.
 */
export interface Time {
  h: number;
  m: number;
  s: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Parses "HH:mm" / "HH:mm:ss"; returns null if invalid (out of range, wrong format). */
export function parseTime(text: string | null | undefined): Time | null {
  if (!text) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = match[3] === undefined ? 0 : Number(match[3]);
  if (h > 23 || m > 59 || s > 59) return null;
  return { h, m, s };
}

export function formatTime(time: Time, seconds: boolean): string {
  return `${pad(time.h)}:${pad(time.m)}${seconds ? `:${pad(time.s)}` : ""}`;
}

/** Human-readable text: in the 12-hour clock it is "02:30 PM". */
export function displayTime(time: Time, seconds: boolean, hour12: boolean): string {
  if (!hour12) return formatTime(time, seconds);
  const h = time.h % 12 === 0 ? 12 : time.h % 12;
  return `${pad(h)}:${pad(time.m)}${seconds ? `:${pad(time.s)}` : ""} ${time.h < 12 ? "AM" : "PM"}`;
}

export const toSeconds = (t: Time) => t.h * 3600 + t.m * 60 + t.s;

export function fromSeconds(total: number): Time {
  const clamped = Math.min(Math.max(Math.round(total), 0), 86399);
  return { h: Math.floor(clamped / 3600), m: Math.floor((clamped % 3600) / 60), s: clamped % 60 };
}

export interface TimeBounds {
  min?: Time | null;
  max?: Time | null;
}

/** Nearest value within a range: the minimum if below it, the maximum if above it. */
export function clampTime(time: Time, { min, max }: TimeBounds): Time {
  let total = toSeconds(time);
  if (min) total = Math.max(total, toSeconds(min));
  if (max) total = Math.min(total, toSeconds(max));
  return fromSeconds(total);
}

/**
 * Whether an option is selectable: an hour / minute is selectable as long as it still contains one valid moment.
 * Pass h to check an hour; h + m to check a minute; h + m + s to check a specific second.
 */
export function isDisabled(
  parts: { h: number; m?: number; s?: number },
  { min, max }: TimeBounds,
): boolean {
  const { h, m, s } = parts;
  const lo = h * 3600 + (m ?? 0) * 60 + (s ?? 0);
  const hi = s !== undefined ? lo : m !== undefined ? h * 3600 + m * 60 + 59 : h * 3600 + 3599;
  if (min && hi < toSeconds(min)) return true;
  if (max && lo > toSeconds(max)) return true;
  return false;
}

/** 0 to count-1, taken by step. */
export const range = (count: number, step: number): number[] =>
  Array.from({ length: Math.ceil(count / Math.max(1, step)) }, (_, i) => i * Math.max(1, step));

/** The current moment (local time zone); how to use it down to the minute / second is up to the caller. */
export function nowTime(): Time {
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
}

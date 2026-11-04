import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { clampTime, formatTime, isDisabled, parseTime, range } from "./time.ts";
import type { Time, TimeBounds } from "./time.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export interface TimePanelProps {
  /** Current time "HH:mm[:ss]", null if none is selected. */
  value: string | null;
  /** Called when an option is clicked / chosen with Enter, with the new time "HH:mm[:ss]" (24-hour, clamped into `min` / `max`). */
  onChange: (value: string) => void;
  /**
   * Show a seconds column; the value then includes ":ss".
   * @default false
   */
  seconds?: boolean;
  /**
   * Show hours 12–11 with an AM / PM column (display only; the value stays 24-hour).
   * @default false
   */
  hour12?: boolean;
  /**
   * Interval between hour options.
   * @default 1
   */
  hourStep?: number;
  /**
   * Interval between minute options, e.g. 15 for :00 / :15 / :30 / :45.
   * @default 1
   */
  minuteStep?: number;
  /**
   * Interval between second options.
   * @default 1
   */
  secondStep?: number;
  /** Earliest selectable time "HH:mm[:ss]"; earlier options are disabled. */
  min?: string;
  /** Latest selectable time "HH:mm[:ss]"; later options are disabled. */
  max?: string;
  labels?: Partial<TimePanelLabels>;
}

export interface TimePanelLabels {
  hour: string;
  minute: string;
  second: string;
  period: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

interface Option {
  key: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  /** New time after a click / Enter. */
  pick: () => Time;
}

/**
 * Time selection panel: several scrollable columns of options (hours, minutes, optional seconds, and AM / PM for the 12-hour clock); clicking one sets it.
 * Each column is a listbox: up / down keys move between options, Home / End go to the ends, Enter selects; the selected item scrolls to the middle of its column.
 * When there is no value yet, clicking any item fills in the other parts starting from 00 (then clamped into the min / max range).
 */
export function TimePanel({
  value,
  onChange,
  seconds = false,
  hour12 = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  min,
  max,
  labels: labelsProp,
}: TimePanelProps) {
  const config = useConfig();
  const labels = { ...en.labels.timePicker, ...config.labels?.timePicker, ...labelsProp };
  const bounds: TimeBounds = { min: parseTime(min), max: parseTime(max) };
  const current = parseTime(value);
  const base: Time = current ?? { h: 0, m: 0, s: 0 };

  const commit = (next: Time) => onChange(formatTime(clampTime(next, bounds), seconds));

  const hourOptions: Option[] = (
    hour12
      ? range(12, Math.max(1, hourStep)).map((h12) => {
          const period = base.h >= 12 ? 12 : 0;
          const h = h12 + period;
          return {
            label: pad(h12 === 0 ? 12 : h12),
            h,
            selected: !!current && current.h % 12 === h12,
          };
        })
      : range(24, hourStep).map((h) => ({
          label: pad(h),
          h,
          selected: !!current && current.h === h,
        }))
  ).map(({ label, h, selected }) => ({
    key: `h${h}`,
    label,
    selected,
    disabled: isDisabled({ h }, bounds),
    pick: () => ({ ...base, h }),
  }));

  const minuteOptions: Option[] = range(60, minuteStep).map((m) => ({
    key: `m${m}`,
    label: pad(m),
    selected: !!current && current.m === m,
    disabled: isDisabled({ h: base.h, m }, bounds),
    pick: () => ({ ...base, m }),
  }));

  const secondOptions: Option[] = range(60, secondStep).map((s) => ({
    key: `s${s}`,
    label: pad(s),
    selected: !!current && current.s === s,
    disabled: isDisabled({ h: base.h, m: base.m, s }, bounds),
    pick: () => ({ ...base, s }),
  }));

  const periodOptions: Option[] = (["AM", "PM"] as const).map((period, i) => {
    const h = (base.h % 12) + i * 12;
    return {
      key: period,
      label: period,
      selected: !!current && current.h >= 12 === (i === 1),
      disabled: isDisabled({ h }, bounds) && isDisabled({ h: (h + 1) % 24 }, bounds),
      pick: () => ({ ...base, h }),
    };
  });

  const columns: { name: string; label: string; options: Option[] }[] = [
    { name: "hour", label: labels.hour, options: hourOptions },
    { name: "minute", label: labels.minute, options: minuteOptions },
    ...(seconds ? [{ name: "second", label: labels.second, options: secondOptions }] : []),
    ...(hour12 ? [{ name: "period", label: labels.period, options: periodOptions }] : []),
  ];

  return (
    <div role="group" data-slot="timepanel">
      {columns.map((column) => (
        <Column key={column.name} {...column} onPick={(option) => commit(option.pick())} />
      ))}
    </div>
  );
}

function Column({
  name,
  label,
  options,
  onPick,
}: {
  name: string;
  label: string;
  options: Option[];
  onPick: (option: Option) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((o) => o.selected);

  // Scroll the selected item to the middle of its column (scroll only this column, not the whole page)
  useEffect(() => {
    const column = ref.current;
    const el = column?.querySelector<HTMLElement>('[data-slot="timepanel-option"][data-selected]');
    if (!column || !el) return;
    column.scrollTop = el.offsetTop - column.clientHeight / 2 + el.clientHeight / 2;
  }, [selectedIndex]);

  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  // Only one item is in the tab order: the selected one, or the first available if none is selected
  const tabbable =
    selectedIndex >= 0 && !options[selectedIndex]!.disabled ? selectedIndex : enabled[0];

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    const pos = enabled.indexOf(index);
    let target: number | undefined;
    if (event.key === "ArrowDown") target = enabled[Math.min(pos + 1, enabled.length - 1)];
    else if (event.key === "ArrowUp") target = enabled[Math.max(pos - 1, 0)];
    else if (event.key === "Home") target = enabled[0];
    else if (event.key === "End") target = enabled[enabled.length - 1];
    else return;
    event.preventDefault();
    if (target !== undefined) {
      ref.current?.querySelectorAll<HTMLElement>('[data-slot="timepanel-option"]')[target]?.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      data-slot="timepanel-column"
      data-column={name}
    >
      {options.map((option, i) => (
        <button
          key={option.key}
          type="button"
          role="option"
          aria-selected={option.selected}
          disabled={option.disabled}
          tabIndex={i === tabbable ? 0 : -1}
          data-slot="timepanel-option"
          data-selected={option.selected ? "" : undefined}
          data-disabled={option.disabled ? "" : undefined}
          onClick={() => onPick(option)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

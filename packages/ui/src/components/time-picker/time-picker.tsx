import { useState } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { useFieldDefaults } from "../field/context.ts";
import { Popover } from "../popover/index.ts";
import { TimePanel } from "./time-panel.tsx";
import type { TimePanelLabels, TimePanelProps } from "./time-panel.tsx";
import { clampTime, displayTime, formatTime, isDisabled, nowTime, parseTime } from "./time.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export interface TimePickerLabels extends TimePanelLabels {
  now: string;
  ok: string;
  clear: string;
  /** Hint when there is no value, and the name of the popup. */
  placeholder: string;
  choose: string;
}

export interface TimePickerProps extends Pick<
  TimePanelProps,
  "seconds" | "hour12" | "hourStep" | "minuteStep" | "secondStep" | "min" | "max"
> {
  /** Time "HH:mm" ("HH:mm:ss" when seconds are shown), 24-hour clock; null if none is selected. */
  value?: string | null;
  /**
   * Initial `value` when uncontrolled.
   * @default null
   */
  defaultValue?: string | null;
  /** Called with the new `value`; pass `value` as well to control it. */
  onValueChange?: (value: string | null) => void;
  /** Text shown while empty; defaults to the locale's placeholder ("Pick a time" in English). */
  placeholder?: string;
  /**
   * Show "Clear" at the bottom of the panel.
   * @default true
   */
  clearable?: boolean;
  /**
   * Visual variant, as on Select; inside a Field it defaults to the Field's.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step, as on Select; inside a Field it defaults to the Field's.
   * @default "md"
   */
  size?: UISize;
  /**
   * Fills the width of the parent.
   * @default false
   */
  fullWidth?: boolean;
  /** Shows the invalid state. */
  invalid?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
  /** Write a hidden input so the value is submitted with the native form. */
  name?: string;
  /** Text of the button and columns (for switching languages). */
  labels?: Partial<TimePickerLabels>;
  /** Accessible name, when there is no visible label. */
  "aria-label"?: string;
}

export const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/**
 * Time picker: a field-like trigger that opens a popup of scrollable hour / minute / (optional) second columns to pick a time of day.
 * `value` / `onValueChange` hold an "HH:mm" string ("HH:mm:ss" with `seconds`), 24-hour, or null; `hour12` only affects display and the panel, not the value.
 * `min` / `max` limit the range and `hourStep` / `minuteStep` / `secondStep` thin out the options.
 * Clicking an item changes that part and the value updates immediately (no need to click "OK"); "OK" only closes the panel; "Now" sets the current time (unavailable when outside min / max); `clearable` shows "Clear".
 * For a date use DatePicker; for the columns inline without a popup use TimePanel.
 *
 * Theme style: the trigger reuses the Select look (slot is select-trigger), the popup is a Popover (marked data-picker) containing the TimePanel columns.
 */
export function TimePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  seconds = false,
  hour12 = false,
  hourStep,
  minuteStep,
  secondStep,
  min,
  max,
  placeholder: placeholderProp,
  clearable = true,
  variant,
  size,
  fullWidth = false,
  invalid,
  disabled,
  name,
  labels: labelsProp,
  "aria-label": ariaLabel,
}: TimePickerProps) {
  const config = useConfig();
  const labels = { ...en.labels.timePicker, ...config.labels?.timePicker, ...labelsProp };
  const placeholder = placeholderProp ?? labels.placeholder;
  const field = useFieldDefaults();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<string | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const parsed = parseTime(value);

  const change = (next: string | null) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const bounds = { min: parseTime(min), max: parseTime(max) };
  const now = nowTime();
  const nowBlocked = isDisabled({ h: now.h, m: now.m, s: seconds ? now.s : 0 }, bounds);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        // The accessible name must contain the visible text (WCAG 2.5.3 Label in Name), so the value goes first, followed by the name given by the caller
        aria-label={
          ariaLabel
            ? `${parsed ? displayTime(parsed, seconds, hour12) : placeholder}, ${ariaLabel}`
            : undefined
        }
        {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        data-slot="select-trigger"
        data-variant={variant ?? field?.variant ?? "outline"}
        data-size={size ?? field?.size ?? "md"}
        data-full-width={fullWidth ? "" : undefined}
        render={<button type="button" />}
      >
        <span data-slot="select-value" data-placeholder={parsed ? undefined : ""}>
          {parsed ? displayTime(parsed, seconds, hour12) : placeholder}
        </span>
        <span data-slot="select-icon">
          <ClockIcon />
        </span>
      </Popover.Trigger>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <Popover.Content
        data-picker=""
        side="bottom"
        align="start"
        aria-label={ariaLabel ?? labels.choose}
      >
        <TimePanel
          value={value ?? null}
          onChange={change}
          {...{ seconds, hour12, hourStep, minuteStep, secondStep, min, max }}
          labels={labels}
        />
        <div data-slot="timepanel-footer">
          <Button
            size="sm"
            variant="ghost"
            disabled={nowBlocked}
            onClick={() => change(formatTime(clampTime(now, bounds), seconds))}
          >
            {labels.now}
          </Button>
          <span data-slot="timepanel-footer-end">
            {clearable && parsed ? (
              <Button size="sm" variant="ghost" color="neutral" onClick={() => change(null)}>
                {labels.clear}
              </Button>
            ) : null}
            <Button size="sm" color="primary" onClick={() => setOpen(false)}>
              {labels.ok}
            </Button>
          </span>
        </div>
      </Popover.Content>
    </Popover>
  );
}

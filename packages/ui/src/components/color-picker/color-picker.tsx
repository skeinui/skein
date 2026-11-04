import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { ColorFormat, UISize } from "../../contract.ts";
import { Input } from "../input/index.ts";
import { Popover } from "../popover/index.ts";
import { Toggle, ToggleGroup } from "../toggle/index.ts";
import { formatColor, hsvToRgb, parseColor, rgbToHsv, toHex } from "./color.ts";
import type { HSVA } from "./color.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface ColorPickerProps {
  /**
   * Current color; the string format follows format: hex is #rrggbb (#rrggbbaa when opacity is below 1),
   * rgb is `rgb(22 119 255 / 0.5)`, hsb is `hsb(215 91% 100%)`. All three formats are accepted when reading.
   */
  value?: string;
  /** @default "#000000" */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Current format (controlled): hex has one input, rgb three (R G B), hsb three (H S B); onValueChange also outputs in this format. */
  format?: ColorFormat;
  /** @default "hex" */
  defaultFormat?: ColorFormat;
  /** Callback when the format is switched in the panel; `onValueChange` is then called again with the value in the new format. */
  onFormatChange?: (format: ColorFormat) => void;
  /**
   * Formats that can be switched in the panel; with only one, the switch is not shown.
   * @default ["hex", "rgb", "hsb"]
   */
  formats?: readonly ColorFormat[];
  /**
   * Show the opacity slider and the opacity input (percentage).
   * @default false
   */
  alpha?: boolean;
  /** Preset colors, each a hex; invalid ones are ignored. */
  presets?: string[];
  /**
   * Show the hex text next to the swatch in the trigger.
   * @default false
   */
  showValue?: boolean;
  /**
   * Size of the trigger.
   * @default "md"
   */
  size?: UISize;
  /** @default false */
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Write a hidden input so it is submitted with the native form. */
  name?: string;
  "aria-label"?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The color is a dynamic value and the component writes no style: the current color is split into CSS variables and set on each element via refs,
 * and the theme style uses var(--cp-*) to position sliders and draw gradients.
 *   --cp-x / --cp-y  position of the dot on the panel (percentage, unitless)
 *   --cp-hue / --cp-alpha  position of the dot on the hue / opacity sliders (percentage)
 *   --cp-hue-color  solid color of the current hue, used for the panel background
 *   --cp-solid / --cp-color  current color (without / with opacity)
 */
function applyVars(el: HTMLElement | null, { h, s, v, a }: HSVA) {
  if (!el) return;
  const { r, g, b } = hsvToRgb(h, s, v);
  const hue = hsvToRgb(h, 1, 1);
  const set = (k: string, val: string) => el.style.setProperty(k, val);
  set("--cp-x", String(s * 100));
  set("--cp-y", String((1 - v) * 100));
  set("--cp-hue", String((h / 360) * 100));
  set("--cp-alpha", String(a * 100));
  set("--cp-hue-color", `rgb(${hue.r} ${hue.g} ${hue.b})`);
  set("--cp-solid", `rgb(${r} ${g} ${b})`);
  set("--cp-color", `rgb(${r} ${g} ${b} / ${a})`);
}

/** A number input: keeps a local draft, commits on Enter or blur, clamps out-of-range values to the bounds, and restores the original value for non-numbers. */
function ChannelInput({
  label,
  field,
  value,
  max,
  unit = "",
  onCommit,
}: {
  label: string;
  field?: string;
  value: number;
  max: number;
  unit?: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commitDraft = () => {
    if (draft === null) return;
    const n = Number.parseFloat(draft.replace("%", ""));
    setDraft(null);
    if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(0, Math.round(n))));
  };
  return (
    <div data-slot="colorpicker-field" data-field={field ?? label.toLowerCase()}>
      <Input
        size="sm"
        fullWidth
        inputMode="numeric"
        aria-label={label}
        value={draft ?? `${value}${unit}`}
        onValueChange={setDraft}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitDraft();
        }}
      />
    </div>
  );
}

/** Drag on an element: starts on press, the pointer is captured, and on move calls back with a relative position from 0 to 1. */
function useDrag(onMove: (x: number, y: number) => void, enabled: boolean) {
  const dragging = useRef(false);
  const move = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onMove(
      clamp01((event.clientX - rect.left) / (rect.width || 1)),
      clamp01((event.clientY - rect.top) / (rect.height || 1)),
    );
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      move(event);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (dragging.current) move(event);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      dragging.current = false;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
  };
}

/**
 * Color picker: the trigger is a swatch, clicking opens an overlay containing a brightness / saturation panel, a hue bar, an optional opacity bar, a hex input and preset colors.
 * It is stored internally as HSV, so the hue is not lost when saturation is dragged to 0.
 */
export function ColorPicker({
  value: valueProp,
  defaultValue = "#000000",
  onValueChange,
  format: formatProp,
  defaultFormat = "hex",
  onFormatChange,
  formats = ["hex", "rgb", "hsb"],
  alpha = false,
  presets,
  showValue = false,
  size = "md",
  disabled = false,
  open,
  defaultOpen,
  onOpenChange,
  name,
  "aria-label": ariaLabelProp,
}: ColorPickerProps) {
  const t = useLabels("colorPicker");
  const ariaLabel = ariaLabelProp ?? t.color;
  const [hsva, setHsva] = useState<HSVA>(
    () => parseColor(valueProp ?? defaultValue) ?? { h: 0, s: 0, v: 0, a: 1 },
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [innerFormat, setInnerFormat] = useState<ColorFormat>(defaultFormat);
  const format = formatProp ?? innerFormat;

  // Controlled: when the external value differs from the internal one, the external wins (keeping the current hue)
  useEffect(() => {
    if (valueProp === undefined) return;
    const next = parseColor(valueProp, hsva.h);
    if (!next || toHex(next) === toHex(hsva)) return;
    setHsva(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueProp]);

  const effective: HSVA = alpha ? hsva : { ...hsva, a: 1 };
  const text = formatColor(effective, format);
  const hex = toHex(effective);

  const commit = (next: HSVA) => {
    setHsva(next);
    setDraft(null);
    onValueChange?.(formatColor(alpha ? next : { ...next, a: 1 }, format));
  };

  const area = useDrag((x, y) => commit({ ...hsva, s: x, v: 1 - y }), !disabled);
  const hue = useDrag((x) => commit({ ...hsva, h: x * 360 }), !disabled);
  const alphaDrag = useDrag((x) => commit({ ...hsva, a: Math.round(x * 100) / 100 }), !disabled);

  const step = (event: KeyboardEvent<HTMLElement>) => (event.shiftKey ? 0.1 : 0.01);
  const onAreaKey = (event: KeyboardEvent<HTMLElement>) => {
    const d = step(event);
    const map: Record<string, Partial<HSVA>> = {
      ArrowLeft: { s: clamp01(hsva.s - d) },
      ArrowRight: { s: clamp01(hsva.s + d) },
      ArrowUp: { v: clamp01(hsva.v + d) },
      ArrowDown: { v: clamp01(hsva.v - d) },
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    commit({ ...hsva, ...map[event.key] });
  };
  const onHueKey = (event: KeyboardEvent<HTMLElement>) => {
    const d = event.shiftKey ? 10 : 1;
    const map: Record<string, number> = {
      ArrowLeft: hsva.h - d,
      ArrowDown: hsva.h - d,
      ArrowRight: hsva.h + d,
      ArrowUp: hsva.h + d,
      Home: 0,
      End: 360,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    commit({ ...hsva, h: Math.min(360, Math.max(0, map[event.key]!)) });
  };
  const onAlphaKey = (event: KeyboardEvent<HTMLElement>) => {
    const d = step(event);
    const map: Record<string, number> = {
      ArrowLeft: hsva.a - d,
      ArrowDown: hsva.a - d,
      ArrowRight: hsva.a + d,
      ArrowUp: hsva.a + d,
      Home: 0,
      End: 1,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    commit({ ...hsva, a: Math.round(clamp01(map[event.key]!) * 100) / 100 });
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = parseColor(draft, hsva.h);
    if (parsed) commit(alpha ? parsed : { ...parsed, a: 1 });
    else setDraft(null);
  };

  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);
  const setRgb = (next: { r: number; g: number; b: number }) => {
    const hsv = rgbToHsv(next.r, next.g, next.b);
    commit({ ...hsva, ...hsv, h: hsv.s === 0 || hsv.v === 0 ? hsva.h : hsv.h });
  };

  const pct = (n: number) => Math.round(n * 100);

  const switchFormat = (next: ColorFormat) => {
    if (next === format) return;
    if (formatProp === undefined) setInnerFormat(next);
    setDraft(null);
    onFormatChange?.(next);
    onValueChange?.(formatColor(effective, next));
  };

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger
        data-slot="colorpicker-trigger"
        data-size={size}
        disabled={disabled}
        // When the color value is shown, the accessible name must include this visible text (WCAG 2.5.3)
        aria-label={showValue ? `${text}, ${ariaLabel}` : ariaLabel}
      >
        <span data-slot="colorpicker-swatch" ref={(el) => applyVars(el, effective)} />
        {showValue ? <span data-slot="colorpicker-value">{text}</span> : null}
      </Popover.Trigger>
      {name ? <input type="hidden" name={name} value={text} /> : null}
      <Popover.Content align="start" aria-label={ariaLabel}>
        <div data-slot="colorpicker-panel" ref={(el) => applyVars(el, effective)}>
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={t.saturation}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct(hsva.s)}
            aria-valuetext={`saturation ${pct(hsva.s)}%, brightness ${pct(hsva.v)}%`}
            data-slot="colorpicker-area"
            {...area}
            onKeyDown={onAreaKey}
          >
            <span data-slot="colorpicker-area-thumb" />
          </div>
          <div data-slot="colorpicker-controls">
            <span data-slot="colorpicker-preview" />
            <div data-slot="colorpicker-sliders">
              <div
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={t.hue}
                aria-valuemin={0}
                aria-valuemax={360}
                aria-valuenow={Math.round(hsva.h)}
                data-slot="colorpicker-hue"
                {...hue}
                onKeyDown={onHueKey}
              >
                <span data-slot="colorpicker-hue-thumb" />
              </div>
              {alpha ? (
                <div
                  role="slider"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={t.alpha}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct(hsva.a)}
                  data-slot="colorpicker-alpha"
                  {...alphaDrag}
                  onKeyDown={onAlphaKey}
                >
                  <span data-slot="colorpicker-alpha-thumb" />
                </div>
              ) : null}
            </div>
          </div>
          {formats.length > 1 ? (
            <div data-slot="colorpicker-formats">
              <ToggleGroup
                variant="outline"
                size="sm"
                attached
                aria-label={t.format}
                value={[format]}
                onValueChange={(next) => {
                  const picked = next[0] as ColorFormat | undefined;
                  if (picked) switchFormat(picked);
                }}
              >
                {formats.map((f) => (
                  <Toggle key={f} value={f}>
                    {f.toUpperCase()}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>
          ) : null}
          <div data-slot="colorpicker-input" data-format={format}>
            {format === "hex" ? (
              <div data-slot="colorpicker-field" data-field="hex">
                <Input
                  size="sm"
                  fullWidth
                  aria-label={t.hex}
                  spellCheck={false}
                  value={draft ?? hex}
                  invalid={draft !== null && !parseColor(draft)}
                  onValueChange={setDraft}
                  onBlur={commitDraft}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitDraft();
                  }}
                />
              </div>
            ) : format === "rgb" ? (
              <>
                <ChannelInput
                  label="R"
                  value={r}
                  max={255}
                  onCommit={(n) => setRgb({ r: n, g, b })}
                />
                <ChannelInput
                  label="G"
                  value={g}
                  max={255}
                  onCommit={(n) => setRgb({ r, g: n, b })}
                />
                <ChannelInput
                  label="B"
                  value={b}
                  max={255}
                  onCommit={(n) => setRgb({ r, g, b: n })}
                />
              </>
            ) : (
              <>
                <ChannelInput
                  label="H"
                  value={Math.round(hsva.h)}
                  max={360}
                  onCommit={(n) => commit({ ...hsva, h: n })}
                />
                <ChannelInput
                  label="S"
                  value={pct(hsva.s)}
                  max={100}
                  unit="%"
                  onCommit={(n) => commit({ ...hsva, s: n / 100 })}
                />
                <ChannelInput
                  label="B"
                  value={pct(hsva.v)}
                  max={100}
                  unit="%"
                  onCommit={(n) => commit({ ...hsva, v: n / 100 })}
                />
              </>
            )}
            {alpha ? (
              <ChannelInput
                label="Alpha"
                field="alpha"
                value={pct(hsva.a)}
                max={100}
                unit="%"
                onCommit={(n) => commit({ ...hsva, a: n / 100 })}
              />
            ) : null}
          </div>
          {presets && presets.length > 0 ? (
            <div role="group" aria-label={t.presets} data-slot="colorpicker-presets">
              {presets.map((preset) => {
                const parsed = parseColor(preset);
                if (!parsed) return null;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-label={preset}
                    data-slot="colorpicker-preset"
                    data-selected={toHex(parsed) === hex ? "" : undefined}
                    ref={(el) => applyVars(el, parsed)}
                    onClick={() => commit(alpha ? parsed : { ...parsed, a: 1 })}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </Popover.Content>
    </Popover>
  );
}

import type { ColorFormat } from "../../contract.ts";

export interface HSVA {
  /** Hue 0–360 */
  h: number;
  /** Saturation 0–1 */
  s: number;
  /** Brightness 0–1 */
  v: number;
  /** Opacity 0–1 */
  a: number;
}

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** Parse #rgb / #rgba / #rrggbb / #rrggbbaa; returns null if invalid. */
export function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
  if (!m) return null;
  let hex = m[1]!;
  if (hex.length <= 4)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/** Output lowercase hex; includes the fourth byte when opacity is not 1. */
export function toHex({ h, s, v, a }: HSVA): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ""}`;
}

/** Get HSVA from hex; when saturation or brightness is 0 the hue is meaningless, so fallbackHue is used. */
export function fromHex(input: string, fallbackHue = 0): HSVA | null {
  const rgb = parseHex(input);
  if (!rgb) return null;
  const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b);
  return { h: s === 0 || v === 0 ? fallbackHue : h, s, v, a: clamp(rgb.a) };
}

export const normalizeHex = (input: string): string | null => {
  const hsva = fromHex(input);
  return hsva ? toHex(hsva) : null;
};

const num = (v: string) => Number.parseFloat(v.replace("%", ""));

/**
 * Parse a color string: hex, `rgb(22 119 255 / 0.5)`, `rgba(22, 119, 255, 0.5)`,
 * `hsb(215 91% 100%)`, `hsba(215, 91%, 100%, 0.5)`. Returns null if invalid.
 */
export function parseColor(input: string, fallbackHue = 0): HSVA | null {
  const text = input.trim();
  const fn = /^(rgba?|hsba?)\(\s*([^)]*?)\s*\)$/i.exec(text);
  if (!fn) return fromHex(text, fallbackHue);
  const parts = fn[2]!.split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const nums = parts.map(num);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const a =
    nums.length === 4
      ? clamp(nums[3]! > 1 && parts[3]!.endsWith("%") ? nums[3]! / 100 : nums[3]!)
      : 1;
  if (fn[1]!.toLowerCase().startsWith("rgb")) {
    const [r, g, b] = nums.map((n) => clamp(n, 0, 255)) as [number, number, number];
    const hsv = rgbToHsv(r, g, b);
    return { ...hsv, h: hsv.s === 0 || hsv.v === 0 ? fallbackHue : hsv.h, a };
  }
  const h = clamp(nums[0]!, 0, 360);
  const sat = clamp(nums[1]! / 100);
  const val = clamp(nums[2]! / 100);
  return { h, s: sat, v: val, a };
}

/** Output by format: hex `#rrggbb[aa]`, `rgb(r g b[ / a])`, `hsb(h s% b%[ / a])`. */
export function formatColor(hsva: HSVA, format: ColorFormat): string {
  if (format === "hex") return toHex(hsva);
  const alpha = hsva.a < 1 ? ` / ${Math.round(hsva.a * 100) / 100}` : "";
  if (format === "rgb") {
    const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);
    return `rgb(${r} ${g} ${b}${alpha})`;
  }
  return `hsb(${Math.round(hsva.h)} ${Math.round(hsva.s * 100)}% ${Math.round(hsva.v * 100)}%${alpha})`;
}

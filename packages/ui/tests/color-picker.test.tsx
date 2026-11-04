// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { ColorPicker } from "../src/index.ts";
import {
  formatColor,
  fromHex,
  parseColor,
  parseHex,
  toHex,
} from "../src/components/color-picker/color.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("color conversion", () => {
  test("parseHex accepts 3 / 4 / 6 / 8 digits, with or without #, null when invalid", () => {
    expect(parseHex("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseHex("00ff00")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parseHex("#0000ff80")?.a).toBeCloseTo(128 / 255, 5);
    expect(parseHex("#12")).toBeNull();
    expect(parseHex("red")).toBeNull();
  });

  test("hex <-> HSV round-trips", () => {
    for (const hex of [
      "#ff0000",
      "#1677ff",
      "#52c41a",
      "#faad14",
      "#000000",
      "#ffffff",
      "#7f7f7f",
    ]) {
      const hsva = fromHex(hex)!;
      expect(toHex(hsva)).toBe(hex);
    }
  });

  test("the fourth byte only with alpha below 1", () => {
    expect(toHex({ h: 0, s: 1, v: 1, a: 1 })).toBe("#ff0000");
    expect(toHex({ h: 0, s: 1, v: 1, a: 0.5 })).toBe("#ff000080");
  });

  test("grey (saturation 0) keeps the given hue", () => {
    expect(fromHex("#808080", 210)!.h).toBe(210);
    expect(fromHex("#336699", 0)!.h).toBeCloseTo(210, 0);
  });
});

describe("color formats", () => {
  test("parseColor reads hex / rgb / rgba / hsb / hsba, with commas, spaces or slashes", () => {
    expect(toHex(parseColor("rgb(22, 119, 255)")!)).toBe("#1677ff");
    expect(toHex(parseColor("rgb(22 119 255 / 0.5)")!)).toBe("#1677ff80");
    expect(toHex(parseColor("rgba(255,0,0,0.5)")!)).toBe("#ff000080");
    expect(toHex(parseColor("hsb(0 100% 100%)")!)).toBe("#ff0000");
    expect(toHex(parseColor("hsba(120, 100%, 50%, 1)")!)).toBe("#008000");
    expect(parseColor("rgb(1 2)")).toBeNull();
    expect(parseColor("rgb(a b c)")).toBeNull();
    expect(parseColor("hsl(0 0% 0%)")).toBeNull();
  });

  test("formatColor outputs by format, alpha only below 1", () => {
    const red = { h: 0, s: 1, v: 1, a: 1 };
    expect(formatColor(red, "hex")).toBe("#ff0000");
    expect(formatColor(red, "rgb")).toBe("rgb(255 0 0)");
    expect(formatColor(red, "hsb")).toBe("hsb(0 100% 100%)");
    expect(formatColor({ ...red, a: 0.5 }, "rgb")).toBe("rgb(255 0 0 / 0.5)");
    expect(formatColor({ ...red, a: 0.5 }, "hsb")).toBe("hsb(0 100% 100% / 0.5)");
  });
});

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });
const panel = () => document.querySelector<HTMLElement>('[data-slot="colorpicker-panel"]');

describe("ColorPicker", () => {
  test("SSR: the trigger has only a swatch and (optional) hex text, no class / style, the panel is not rendered by default", () => {
    const html = ssr(
      createElement(ColorPicker, { defaultValue: "#1677ff", showValue: true, name: "color" }),
    );
    expect(html).toContain('data-slot="colorpicker-trigger"');
    expect(html).toContain('data-slot="colorpicker-swatch"');
    expect(html).toContain("#1677ff");
    expect(html).toContain('<input type="hidden" name="color" value="#1677ff"');
    expect(html).not.toContain("colorpicker-panel");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("clicking the trigger opens the panel, swatches carry the --cp-color variable", () => {
    const h = mount(createElement(ColorPicker, { defaultValue: "#ff0000" }));
    const swatch = h.querySelector<HTMLElement>('[data-slot="colorpicker-swatch"]')!;
    expect(swatch.style.getPropertyValue("--cp-solid")).toBe("rgb(255 0 0)");
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(panel()).not.toBeNull();
    expect(panel()!.style.getPropertyValue("--cp-hue")).toBe("0");
    expect(panel()!.querySelectorAll('[role="slider"]')).toHaveLength(2);
  });

  test("keyboard: Left / Right on the hue bar change hue, arrow keys on the area change saturation and brightness, onValueChange gives hex", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        defaultValue: "#ff0000",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    const hue = panel()!.querySelector('[data-slot="colorpicker-hue"]')!;
    key(hue, "ArrowRight", { shiftKey: true }); // +10 degrees
    expect(changes.at(-1)).toBe("#ff2a00");
    const area = panel()!.querySelector('[data-slot="colorpicker-area"]')!;
    key(area, "ArrowDown", { shiftKey: true }); // brightness -10%
    expect(changes.at(-1)).toBe("#e62600");
    key(area, "ArrowLeft", { shiftKey: true }); // saturation -10%
    expect(changes.at(-1)).toBe("#e63917");
  });

  test("hex input: Enter commits a valid value, an invalid one reverts to the current value", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        defaultValue: "#ff0000",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    const input = panel()!.querySelector<HTMLInputElement>("input")!;
    const type = (v: string) =>
      act(() => {
        Reflect.set(HTMLInputElement.prototype, "value", v, input);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    type("#00ff00");
    key(input, "Enter");
    expect(changes.at(-1)).toBe("#00ff00");
    type("not a color");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    key(input, "Enter");
    expect(input.value).toBe("#00ff00");
    expect(changes).toHaveLength(1);
  });

  test("presets: clicking commits, the preset matching the current color has data-selected", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        defaultValue: "#ff0000",
        presets: ["#ff0000", "#00ff00", "bogus"],
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    const presets = [...panel()!.querySelectorAll<HTMLElement>('[data-slot="colorpicker-preset"]')];
    expect(presets).toHaveLength(2); // invalid ones are ignored
    expect(presets[0]!.hasAttribute("data-selected")).toBe(true);
    click(presets[1]!);
    expect(changes.at(-1)).toBe("#00ff00");
    expect(presets[1]!.hasAttribute("data-selected")).toBe(true);
  });

  test("alpha: adds an alpha bar, the value has a fourth byte; always 6 digits without alpha", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        alpha: true,
        defaultValue: "#ff0000",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    const a = panel()!.querySelector('[data-slot="colorpicker-alpha"]')!;
    expect(a).not.toBeNull();
    key(a, "ArrowLeft", { shiftKey: true });
    expect(changes.at(-1)).toBe("#ff0000e6");
  });

  test("controlled value: follows outside changes, keeping the hue", () => {
    const h = mount(createElement(ColorPicker, { value: "#808080" }));
    expect(
      h
        .querySelector<HTMLElement>('[data-slot="colorpicker-swatch"]')!
        .style.getPropertyValue("--cp-solid"),
    ).toBe("rgb(128 128 128)");
    act(() => root!.render(createElement(ColorPicker, { value: "#00ff00" })));
    expect(
      h
        .querySelector<HTMLElement>('[data-slot="colorpicker-swatch"]')!
        .style.getPropertyValue("--cp-solid"),
    ).toBe("rgb(0 255 0)");
  });

  test("disabled: the trigger is disabled and does not open", () => {
    const h = mount(createElement(ColorPicker, { disabled: true }));
    const trigger = h.querySelector<HTMLElement>('[data-slot="colorpicker-trigger"]')!;
    expect(trigger.hasAttribute("disabled") || trigger.hasAttribute("data-disabled")).toBe(true);
    click(trigger);
    expect(panel()).toBeNull();
  });

  const typeInto = (input: HTMLInputElement, v: string) =>
    act(() => {
      Reflect.set(HTMLInputElement.prototype, "value", v, input);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const field = (label: string) =>
    panel()!.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;

  test("format=rgb: R G B inputs, changing one commits an rgb string", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        format: "rgb",
        defaultValue: "rgb(255 0 0)",
        showValue: true,
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    expect(h.querySelector('[data-slot="colorpicker-value"]')!.textContent).toBe("rgb(255 0 0)");
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(
      panel()!.querySelector('[data-slot="colorpicker-input"]')!.getAttribute("data-format"),
    ).toBe("rgb");
    expect(field("R").value).toBe("255");
    expect(panel()!.querySelector('input[aria-label="Hex"]')).toBeNull();
    typeInto(field("G"), "128");
    key(field("G"), "Enter");
    expect(changes.at(-1)).toBe("rgb(255 128 0)");
    typeInto(field("B"), "999"); // clamped to 255
    key(field("B"), "Enter");
    expect(changes.at(-1)).toBe("rgb(255 128 255)");
    typeInto(field("R"), "abc"); // not a number, reverted
    key(field("R"), "Enter");
    expect(field("R").value).toBe("255");
  });

  test("format=hsb: H S B inputs, S and B with a percent sign", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        format: "hsb",
        defaultValue: "#ff0000",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(field("H").value).toBe("0");
    expect(field("S").value).toBe("100%");
    typeInto(field("H"), "120");
    key(field("H"), "Enter");
    expect(changes.at(-1)).toBe("hsb(120 100% 100%)");
    typeInto(field("S"), "50%");
    key(field("S"), "Enter");
    expect(changes.at(-1)).toBe("hsb(120 50% 100%)");
  });

  test("alpha: every format gets an alpha input (percent), hex outputs 8 digits", () => {
    const changes: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        alpha: true,
        defaultValue: "#ff0000",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(field("Alpha").value).toBe("100%");
    typeInto(field("Alpha"), "50");
    key(field("Alpha"), "Enter");
    expect(changes.at(-1)).toBe("#ff000080");
    expect(field("Alpha").value).toBe("50%");
  });

  test("no alpha input without alpha", () => {
    const h = mount(createElement(ColorPicker, { format: "rgb" }));
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(panel()!.querySelector('input[aria-label="Alpha"]')).toBeNull();
  });

  const formatButton = (label: string) =>
    [...panel()!.querySelectorAll<HTMLElement>('[data-slot="toggle"]')].find(
      (b) => b.textContent === label,
    )!;

  test("the panel has a HEX / RGB / HSB switch, switching swaps the inputs and calls back in the new format", () => {
    const values: string[] = [];
    const formats: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        defaultValue: "#ff0000",
        onValueChange: (v: string) => values.push(v),
        onFormatChange: (f: string) => formats.push(f),
      }),
    );
    click(h.querySelector('[data-slot="trigger"], [data-slot="colorpicker-trigger"]')!);
    expect(panel()!.querySelectorAll('[data-slot="toggle"]')).toHaveLength(3);
    expect(field("Hex")).not.toBeNull();
    click(formatButton("RGB"));
    expect(formats).toEqual(["rgb"]);
    expect(values.at(-1)).toBe("rgb(255 0 0)");
    expect(field("R").value).toBe("255");
    expect(panel()!.querySelector('input[aria-label="Hex"]')).toBeNull();
    click(formatButton("HSB"));
    expect(values.at(-1)).toBe("hsb(0 100% 100%)");
    expect(field("S").value).toBe("100%");
    click(formatButton("HEX"));
    expect(values.at(-1)).toBe("#ff0000");
    expect(field("Hex").value).toBe("#ff0000");
  });

  test("clicking the current format again neither clears it nor calls back again", () => {
    const formats: string[] = [];
    const h = mount(createElement(ColorPicker, { onFormatChange: (f: string) => formats.push(f) }));
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    click(formatButton("HEX"));
    expect(formats).toEqual([]);
    expect(field("Hex")).not.toBeNull();
  });

  test("controlled format: switching only calls back, the caller decides; no switch with a single format", () => {
    const formats: string[] = [];
    const h = mount(
      createElement(ColorPicker, {
        format: "hex",
        onFormatChange: (f: string) => formats.push(f),
      }),
    );
    click(h.querySelector('[data-slot="colorpicker-trigger"]')!);
    click(formatButton("RGB"));
    expect(formats).toEqual(["rgb"]);
    expect(field("Hex")).not.toBeNull(); // unchanged outside, still hex
    act(() => root?.unmount());
    host?.remove();
    document.body.innerHTML = "";

    const h2 = mount(createElement(ColorPicker, { formats: ["rgb"], defaultFormat: "rgb" }));
    click(h2.querySelector('[data-slot="colorpicker-trigger"]')!);
    expect(panel()!.querySelector('[data-slot="colorpicker-formats"]')).toBeNull();
    expect(field("R")).not.toBeNull();
  });
});

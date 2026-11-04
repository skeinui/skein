// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  Cascader,
  ColorPicker,
  DatePicker,
  QRCode,
  Segmented,
  Slider,
  Table,
  TimePicker,
  Transfer,
} from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}

/** axe's label-content-name-mismatch (WCAG 2.5.3): the accessible name must contain the text visible on the button. */
describe("accessible names contain the visible text (Label in Name)", () => {
  test("DatePicker: the text shown in the button (value or placeholder) first, the caller's name after", () => {
    const visible = (html: string) => /data-slot="select-value"[^>]*>([^<]*)</.exec(html)![1]!;
    const label = (html: string) => /aria-label="([^"]*)"/.exec(html)?.[1];
    const withValue = ssr(
      createElement(DatePicker, { "aria-label": "Birthday", defaultValue: "2024-05-01" }),
    );
    expect(visible(withValue)).not.toBe("");
    expect(label(withValue)).toBe(`${visible(withValue)}, Birthday`);
    const empty = ssr(createElement(DatePicker, { "aria-label": "Birthday", placeholder: "Pick" }));
    expect(label(empty)).toBe("Pick, Birthday");
    // With no name given, don't write aria-label; the name comes from the text inside the button
    expect(ssr(createElement(DatePicker, {}))).not.toContain("aria-label");
  });

  test("TimePicker", () => {
    expect(
      ssr(createElement(TimePicker, { "aria-label": "Start", defaultValue: "09:30" })),
    ).toContain('aria-label="09:30, Start"');
  });

  test("ColorPicker: the name contains the color value when shown; otherwise just the name", () => {
    const withValue = ssr(
      createElement(ColorPicker, {
        showValue: true,
        defaultValue: "#1677ff",
        "aria-label": "Brand",
      }),
    );
    expect(withValue).toMatch(/aria-label="#1677FF, Brand"/i);
    expect(
      ssr(createElement(ColorPicker, { defaultValue: "#1677ff", "aria-label": "Brand" })),
    ).toContain('aria-label="Brand"');
  });

  test("Cascader: single selection puts the value or placeholder first", () => {
    const html = ssr(
      createElement(Cascader, {
        "aria-label": "Region",
        options: [{ value: "a", label: "Alpha" }],
        placeholder: "Choose",
      }),
    );
    expect(html).toContain('aria-label="Choose, Region"');
  });
});

describe("other accessibility fixes", () => {
  test("Slider: aria-label goes to the thumb input; each thumb of a range slider is numbered, thumbLabels can customise them", async () => {
    const el = await mount(
      createElement(Slider, { defaultValue: [20, 70], "aria-label": "Price" }),
    );
    const inputs = [...el.querySelectorAll("input[type=range]")];
    expect(inputs.map((i) => i.getAttribute("aria-label"))).toEqual(["Price 1", "Price 2"]);
    await act(async () => root!.unmount());
    host!.remove();
    const el2 = await mount(
      createElement(Slider, { defaultValue: [1, 2], thumbLabels: ["Min", "Max"] }),
    );
    expect(
      [...el2.querySelectorAll("input[type=range]")].map((i) => i.getAttribute("aria-label")),
    ).toEqual(["Min", "Max"]);
  });

  test("QRCode: role=img on the svg, no role on the wrapper (the mask's button cannot be inside an img)", () => {
    const html = ssr(
      createElement(QRCode, { value: "x", status: "expired", "aria-label": "Login" }),
    );
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="Login"/);
    expect(html).not.toMatch(/<div[^>]*data-slot="qrcode"[^>]*role=/);
  });

  test("Segmented: for icon-only options the title is also the aria-label", () => {
    const html = ssr(
      createElement(Segmented, {
        options: [
          { value: "a", icon: createElement("i"), title: "Alpha" },
          { value: "b", label: "B", title: "Bee" },
        ],
      }),
    );
    expect(html).toContain('title="Alpha" aria-label="Alpha"');
    // When there is text, title is only a hover hint and doesn't override the name
    expect(html).toMatch(/title="Bee"(?![^>]*aria-label)/);
  });

  test("Transfer: the two lists are groups, not sections (no region landmarks)", () => {
    const html = ssr(
      createElement(Transfer, { items: [{ key: "a", label: "A" }], titles: ["Source", "Target"] }),
    );
    expect(html).not.toContain("<section");
    expect(html).toContain('role="group"');
  });

  test("Table: the container is not focusable without overflow; focusable with ResizeObserver and overflowing content", async () => {
    const el = await mount(createElement(Table, { "aria-label": "T" }));
    const box = el.querySelector("[data-slot=table-container]")!;
    // In jsdom scrollWidth / clientWidth are both 0: not scrollable
    expect(box.hasAttribute("tabindex")).toBe(false);
  });
});

/** Found by an extra scan of expanded overlays: an overlay built with Popover is role=dialog and must have a name (axe: aria-dialog-name). */
describe("popups have names", () => {
  const open = async (node: React.ReactElement, triggerSel: string) => {
    const el = await mount(node);
    await act(async () => {
      el.querySelector<HTMLElement>(triggerSel)!.click();
    });
    return document.body;
  };

  test("DatePicker / TimePicker: a default name, or the given aria-label", async () => {
    let body = await open(createElement(DatePicker, {}), "[data-slot=select-trigger]");
    expect(body.querySelector("[data-slot=popover]")!.getAttribute("aria-label")).toBe(
      "Choose date",
    );
    await act(async () => root!.unmount());
    host!.remove();
    body = await open(
      createElement(TimePicker, { "aria-label": "Start" }),
      "[data-slot=select-trigger]",
    );
    expect(body.querySelector("[data-slot=popover]")!.getAttribute("aria-label")).toBe("Start");
  });

  test("ColorPicker: the popup's name is the aria-label (default Color)", async () => {
    const body = await open(createElement(ColorPicker, {}), "[data-slot=colorpicker-trigger]");
    expect(body.querySelector("[data-slot=popover]")!.getAttribute("aria-label")).toBe("Color");
  });

  test("Cascader: the popup has a name, no aria-expanded on role=option (ARIA does not allow it)", async () => {
    const body = await open(
      createElement(Cascader, {
        options: [{ value: "a", label: "A", children: [{ value: "b", label: "B" }] }],
      }),
      "[data-slot=cascader-trigger]",
    );
    expect(body.querySelector("[data-slot=popover]")!.getAttribute("aria-label")).toBe("Options");
    const option = body.querySelector("[role=option]")!;
    expect(option.hasAttribute("aria-expanded")).toBe(false);
    expect(option.hasAttribute("data-has-children")).toBe(true);
  });
});

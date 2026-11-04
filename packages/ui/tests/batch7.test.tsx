// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Combobox, Drawer, NumberField, OtpField, Toggle, ToggleGroup } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Toggle / ToggleGroup / NumberField / OtpField (SSR)", () => {
  test("Toggle defaults to ghost / neutral / md, no styles", () => {
    const html = ssr(createElement(Toggle, { value: "b", "aria-label": "Bold" }, "B"));
    expect(html).toContain('data-slot="toggle"');
    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain('data-color="neutral"');
    expect(html).toContain('data-size="md"');
    expect(html).not.toContain("class=");
  });

  test("ToggleGroup passes variant / size / color down to its Toggles", () => {
    const html = ssr(
      createElement(
        ToggleGroup,
        { variant: "outline", size: "lg", color: "primary", attached: true, defaultValue: ["a"] },
        createElement(Toggle, { value: "a" }, "A"),
        createElement(Toggle, { value: "b" }, "B"),
      ),
    );
    expect(html).toContain('data-slot="toggle-group"');
    expect(html).toContain("data-attached");
    expect(html.match(/data-variant="outline"/g)?.length).toBe(3);
    expect(html.match(/data-size="lg"/g)?.length).toBe(2);
    expect(html).toContain("data-pressed");
  });

  test("NumberField reuses the input-group slots and has increment / decrement buttons", () => {
    const html = ssr(createElement(NumberField, { defaultValue: 3, "aria-label": "Quantity" }));
    expect(html).toContain('data-slot="number-field"');
    expect(html).toContain('data-slot="input-group"');
    expect(html).toContain('data-slot="input-group-input"');
    expect(html).toContain('data-slot="number-field-decrement"');
    expect(html).toContain('data-slot="number-field-increment"');
    expect(ssr(createElement(NumberField, { stepper: false }))).not.toContain(
      "number-field-decrement",
    );
  });

  test("OtpField renders length inputs and separators", () => {
    const html = ssr(createElement(OtpField, { length: 6, separatorAfter: 3 }));
    expect(html.match(/data-slot="otp-input"/g)?.length).toBe(6);
    expect(html.match(/data-slot="otp-separator"/g)?.length).toBe(1);
  });
});

describe("Combobox / Drawer (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
    document.body.innerHTML = "";
  });
  async function mount(node: React.ReactNode) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => root.render(node));
    return el;
  }

  test("Combobox renders options with the select slots when open, the controlled value shows in the input", async () => {
    const el = await mount(
      createElement(Combobox, {
        open: true,
        value: "b",
        options: [
          { value: "a", label: "Apple" },
          { value: "b", label: "Banana" },
        ],
        "aria-label": "Fruit",
      }),
    );
    expect(el.querySelector('[data-slot="input-group"]')).not.toBeNull();
    expect((el.querySelector('[data-slot="input-group-input"]') as HTMLInputElement).value).toBe(
      "Banana",
    );
    expect(document.body.querySelectorAll('[data-slot="select-item"]').length).toBeGreaterThan(0);
    expect(document.body.querySelector('[data-slot="select"]')).not.toBeNull();
  });

  test("Drawer renders backdrop, popup and content when open, data-side comes from side", async () => {
    await mount(
      createElement(
        Drawer,
        { open: true, side: "left" },
        createElement(
          Drawer.Content,
          { size: "lg" },
          createElement(Drawer.Title, null, "Title"),
          createElement(Drawer.Body, null, "Content"),
        ),
      ),
    );
    const drawer = document.body.querySelector('[data-slot="drawer"]');
    expect(drawer?.getAttribute("data-side")).toBe("left");
    expect(drawer?.getAttribute("data-size")).toBe("lg");
    expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-backdrop"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-close"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe("Title");
  });
});

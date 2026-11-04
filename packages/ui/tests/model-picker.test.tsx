// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ModelPicker } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});

const models = [
  { id: "fast", name: "Fast", description: "Quick answers", badge: "New", group: "Everyday" },
  { id: "smart", name: "Smart", description: "Deeper reasoning", group: "Everyday" },
  { id: "huge", name: "Huge", disabled: true, group: "Labs" },
];

describe("ModelPicker", () => {
  test("SSR: the trigger is named and shows the current model, no class / style", () => {
    const html = ssr(createElement(ModelPicker, { models, defaultValue: "smart" }));
    expect(html).toContain('data-slot="model-picker-trigger"');
    expect(html).toContain('aria-label="Model"');
    expect(html).toContain("Smart");
    // Base UI's hidden input carries an inline style (for visual hiding), a behavior-layer practice; the rest has no class / style
    expect(html.replace(/<input[^>]*>/g, "")).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("shows the placeholder when nothing is selected", () => {
    expect(ssr(createElement(ModelPicker, { models }))).toContain("Select model");
    expect(ssr(createElement(ModelPicker, { models, placeholder: "Choose a model" }))).toContain(
      "Choose a model",
    );
  });

  test("open: one option per model with description and tags, grouped by group, disabled ones disabled", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ModelPicker, { models, defaultValue: "fast" }));
    });
    const trigger = host.querySelector<HTMLElement>('[data-slot="model-picker-trigger"]')!;
    await act(async () => trigger.click());
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot="select-item"]')];
    expect(items.map((i) => i.getAttribute("aria-disabled") ?? "false")).toEqual([
      "false",
      "false",
      "true",
    ]);
    expect(document.querySelector('[data-slot="model-picker-item-badge"]')!.textContent).toBe(
      "New",
    );
    expect(document.querySelectorAll('[data-slot="model-picker-item-description"]')).toHaveLength(
      2,
    );
    expect(
      [...document.querySelectorAll('[data-slot="select-group-label"]')].map((g) => g.textContent),
    ).toEqual(["Everyday", "Labs"]);
  });

  test("picking an option calls onValueChange(id) and the trigger shows the new name", async () => {
    const onValueChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ModelPicker, { models, defaultValue: "fast", onValueChange }));
    });
    await act(async () =>
      host!.querySelector<HTMLElement>('[data-slot="model-picker-trigger"]')!.click(),
    );
    const smart = [...document.querySelectorAll<HTMLElement>('[data-slot="select-item"]')].find(
      (i) => i.textContent?.includes("Smart"),
    )!;
    await act(async () => smart.click());
    expect(onValueChange).toHaveBeenCalledWith("smart");
    expect(host.querySelector('[data-slot="model-picker-trigger"]')!.textContent).toContain(
      "Smart",
    );
  });

  test("disabled: the trigger is disabled", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ModelPicker, { models, disabled: true }));
    });
    const trigger = host.querySelector<HTMLElement>('[data-slot="model-picker-trigger"]')!;
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
  });
});

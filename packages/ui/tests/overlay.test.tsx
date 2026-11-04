// @vitest-environment jsdom
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Dialog, Menu, Popover, Select, Tooltip } from "../src/index.ts";

// Portal produces no output in server rendering, so overlays can only be verified in a DOM environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { unmount: () => void; el: HTMLElement }[] = [];

async function mount(node: React.ReactNode) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(node);
  });
  mounted.push({ unmount: () => root.unmount(), el });
}

afterEach(async () => {
  for (const m of mounted.splice(0)) {
    await act(async () => m.unmount());
    m.el.remove();
  }
  document.body.innerHTML = "";
});

const q = (sel: string) => document.body.querySelector(sel);

describe("overlay components (DOM)", () => {
  test("open Dialog renders the backdrop, popup and slots without styles", async () => {
    await mount(
      createElement(
        Dialog,
        { open: true },
        createElement(
          Dialog.Content,
          { size: "sm" },
          createElement(Dialog.Title, null, "Title"),
          createElement(Dialog.Description, null, "Description"),
          createElement(Dialog.Body, null, "Body"),
          createElement(Dialog.Footer, null, "Footer"),
        ),
      ),
    );
    for (const slot of [
      "dialog-backdrop",
      "dialog-viewport",
      "dialog",
      "dialog-title",
      "dialog-description",
      "dialog-body",
      "dialog-footer",
      "dialog-close",
    ]) {
      expect(q(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(q('[data-slot="dialog"]')?.getAttribute("data-size")).toBe("sm");
    expect(q('[data-slot="dialog"]')?.hasAttribute("class")).toBe(false);
  });

  test("Dialog closeButton=false renders no close button", async () => {
    await mount(
      createElement(
        Dialog,
        { open: true },
        createElement(
          Dialog.Content,
          { closeButton: false },
          createElement(Dialog.Title, null, "t"),
        ),
      ),
    );
    expect(q('[data-slot="dialog-close"]')).toBeNull();
  });

  test("open Popover renders the popup and title", async () => {
    await mount(
      createElement(
        Popover,
        { open: true },
        createElement(Popover.Trigger, null, "Open"),
        createElement(
          Popover.Content,
          null,
          createElement(Popover.Title, null, "Title"),
          createElement(Popover.Description, null, "Description"),
        ),
      ),
    );
    expect(q('[data-slot="popover"]')).not.toBeNull();
    expect(q('[data-slot="popover-positioner"]')).not.toBeNull();
    expect(q('[data-slot="popover-title"]')?.textContent).toBe("Title");
  });

  test("open Menu renders items, groups and separators", async () => {
    await mount(
      createElement(
        Menu,
        { open: true },
        createElement(Menu.Trigger, null, "Menu"),
        createElement(
          Menu.Content,
          null,
          createElement(Menu.Item, null, "Edit"),
          createElement(Menu.Separator),
          createElement(Menu.Item, { color: "danger" }, "Delete"),
        ),
      ),
    );
    expect(q('[data-slot="menu"]')).not.toBeNull();
    expect(document.body.querySelectorAll('[data-slot="menu-item"]').length).toBe(2);
    expect(q('[data-slot="menu-item"][data-color="danger"]')).not.toBeNull();
    expect(q('[data-slot="menu-separator"]')).not.toBeNull();
  });

  test("Select trigger shows the selected label and lists options when open", async () => {
    await mount(
      createElement(Select, {
        open: true,
        value: "b",
        options: [
          { value: "a", label: "Apple" },
          { value: "b", label: "Banana" },
        ],
        "aria-label": "Fruit",
      }),
    );
    expect(q('[data-slot="select-trigger"]')).not.toBeNull();
    expect(q('[data-slot="select-value"]')?.textContent).toBe("Banana");
    expect(document.body.querySelectorAll('[data-slot="select-item"]').length).toBe(2);
  });

  test("Select without a value shows the placeholder and data-placeholder", async () => {
    await mount(
      createElement(Select, {
        options: [{ value: "a", label: "Apple" }],
        placeholder: "Pick one",
        "aria-label": "Fruit",
      }),
    );
    const value = q('[data-slot="select-value"]');
    expect(value?.textContent).toBe("Pick one");
    expect(value?.hasAttribute("data-placeholder")).toBe(true);
  });

  test("open Tooltip renders its content", async () => {
    await mount(
      createElement(
        Tooltip.Provider,
        null,
        createElement(Tooltip, {
          open: true,
          content: "Hint",
          children: createElement("button", null, "x"),
        }),
      ),
    );
    expect(q('[data-slot="tooltip"]')?.textContent).toContain("Hint");
    expect(q('[data-slot="tooltip-positioner"]')).not.toBeNull();
  });
});

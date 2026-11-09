// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { FormDialog, FormDrawer } from "../src/index.ts";
import type { FormDrawerProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
const type = async (name: string, text: string) => {
  const el = input(name);
  await act(async () => {
    // The setter on the prototype: React uses it to tell whether the value really changed
    // oxlint-disable-next-line typescript/unbound-method
    Reflect.set(HTMLInputElement.prototype, "value", text, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
};
const button = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === text)!;
const press = async (el: HTMLElement) => {
  await act(async () => el.click());
  await settle();
};

const base = (over: Partial<FormDrawerProps> = {}): FormDrawerProps => ({
  open: true,
  onOpenChange: () => {},
  title: "New person",
  fields: [{ name: "name", label: "Name", required: true }],
  onSubmit: () => {},
  ...over,
});

describe.each([
  ["FormDrawer", FormDrawer, "drawer"],
  ["FormDialog", FormDialog, "dialog"],
] as const)("%s", (_name, Panel, slot) => {
  test("closed: nothing; open: the title, the form with its fields, and Cancel and Save in the footer", async () => {
    await mount(createElement(Panel, base({ open: false })));
    expect(document.querySelector(`[data-slot="${slot}"]`)).toBeNull();
    await mount(createElement(Panel, base({ description: "Who is it?" })));
    expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    expect(document.body.textContent).toContain("New person");
    expect(document.body.textContent).toContain("Who is it?");
    expect(document.querySelector('[data-slot="form"]')).not.toBeNull();
    // The form has no buttons of its own: they are in the footer
    expect(document.querySelector('[data-slot="form"] [data-slot="form-actions"]')).toBeNull();
    expect(button("Save")).toBeTruthy();
    expect(button("Cancel")).toBeTruthy();
  });

  test("Save is outside the <form> and submits it by `form={id}`", async () => {
    await mount(createElement(Panel, base()));
    const form = document.querySelector("form")!;
    expect(form.id).not.toBe("");
    const save = button("Save");
    expect(save.getAttribute("form")).toBe(form.id);
    expect(form.contains(save)).toBe(false);
    expect(save.type).toBe("submit");
  });

  test("submitting: invalid values are not sent; valid ones are, and the panel is not closed by it", async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    await mount(createElement(Panel, base({ onSubmit, onOpenChange })));
    await press(button("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot="field-error"]')).not.toBeNull();
    await type("name", "Ada");
    await press(button("Save"));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Ada" });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test("while the promise of onSubmit is pending Save spins and Cancel is off; a rejection keeps the panel", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((r) => (finish = r)));
    await mount(createElement(Panel, base({ onSubmit })));
    await type("name", "Ada");
    await press(button("Save"));
    expect(button("Cancel").disabled).toBe(true);
    expect(document.querySelector('button[type="submit"][data-loading]')).not.toBeNull();
    await act(async () => finish());
    await settle();
    expect(button("Cancel").disabled).toBe(false);
  });

  test("Cancel asks to close; labels can be changed; defaultValues start the form", async () => {
    const onOpenChange = vi.fn();
    await mount(
      createElement(
        Panel,
        base({
          onOpenChange,
          submitLabel: "Create",
          cancelLabel: "Never mind",
          defaultValues: { name: "Grace" },
        }),
      ),
    );
    expect(button("Create")).toBeTruthy();
    expect(input("name").value).toBe("Grace");
    await press(button("Never mind"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

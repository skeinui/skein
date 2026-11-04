// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Table } from "../src/index.ts";
import type { TableEditValue } from "../src/index.ts";

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
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}

const wrap = (cell: React.ReactElement) =>
  createElement("table", null, createElement("tbody", null, createElement("tr", null, cell)));
const trigger = () => document.querySelector<HTMLButtonElement>('[data-slot="table-edit-trigger"]');
const input = () => document.querySelector<HTMLInputElement>("input");
const cell = () => document.querySelector<HTMLElement>('[data-slot="table-cell"]')!;

async function type(el: HTMLInputElement, text: string) {
  await act(async () => {
    Reflect.set(HTMLInputElement.prototype, "value", text, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });

function Harness(props: {
  initial?: TableEditValue;
  type?: "text" | "number" | "select";
  validate?: (v: TableEditValue) => string | null | undefined;
  onCommit?: (v: TableEditValue) => void;
}) {
  const [value, setValue] = useState<TableEditValue>(props.initial ?? "Ann");
  return wrap(
    createElement(Table.EditableCell, {
      label: "Name",
      value,
      type: props.type,
      validate: props.validate,
      options: [
        { value: "admin", label: "Admin" },
        { value: "dev", label: "Developer" },
      ],
      onCommit: (v: TableEditValue) => {
        setValue(v);
        props.onCommit?.(v);
      },
    }),
  );
}

describe("Table.EditableCell", () => {
  test("SSR: a button at rest, named with the visible text and the column name, no class / style", () => {
    const html = ssr(
      wrap(createElement(Table.EditableCell, { label: "Name", value: "Ann", onCommit: () => {} })),
    );
    expect(html).toContain('data-slot="table-edit-trigger"');
    expect(html).toContain('aria-label="Ann, Name"');
    expect(html).toContain("data-editable");
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).not.toContain("<input");
    // An empty value shows a placeholder
    const empty = ssr(
      wrap(createElement(Table.EditableCell, { label: "Name", value: null, onCommit: () => {} })),
    );
    expect(empty).toContain("data-placeholder");
    expect(empty).toContain("—");
  });

  test("disabled: no button, no data-editable", () => {
    const html = ssr(
      wrap(
        createElement(Table.EditableCell, {
          label: "Name",
          value: "Ann",
          disabled: true,
          onCommit: () => {},
        }),
      ),
    );
    expect(html).not.toContain("<button");
    expect(html).not.toContain("data-editable");
    expect(html).toContain("Ann");
  });

  test("click to edit: the input has the column name, the value is selected; Enter commits and returns focus to the button", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { onCommit }));
    await act(async () => trigger()!.click());
    expect(cell().hasAttribute("data-editing")).toBe(true);
    expect(input()!.getAttribute("aria-label")).toBe("Name");
    expect(input()!.value).toBe("Ann");
    expect(input()!.selectionStart).toBe(0);
    expect(input()!.selectionEnd).toBe(3);
    await type(input()!, "Bob");
    expect(onCommit).not.toHaveBeenCalled();
    await key(input()!, "Enter");
    expect(onCommit).toHaveBeenCalledWith("Bob");
    expect(input()).toBeNull();
    expect(trigger()!.textContent).toBe("Bob");
    expect(document.activeElement).toBe(trigger());
  });

  test("editing locks the cell's original width (--tbl-edit-w), removed afterwards", async () => {
    const proto = HTMLElement.prototype;
    const original = Object.getOwnPropertyDescriptor(proto, "offsetWidth");
    Object.defineProperty(proto, "offsetWidth", { configurable: true, get: () => 123 });
    try {
      await mount(createElement(Harness));
      await act(async () => trigger()!.click());
      expect(cell().style.getPropertyValue("--tbl-edit-w")).toBe("123px");
      await key(input()!, "Escape");
      expect(cell().style.getPropertyValue("--tbl-edit-w")).toBe("");
    } finally {
      if (original) Object.defineProperty(proto, "offsetWidth", original);
      else delete (proto as { offsetWidth?: number }).offsetWidth;
    }
  });

  test("F2 also starts editing", async () => {
    await mount(createElement(Harness));
    await key(trigger()!, "F2");
    expect(input()).not.toBeNull();
  });

  test("Esc cancels: value unchanged, no commit, focus back on the button", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { onCommit }));
    await act(async () => trigger()!.click());
    await type(input()!, "Zed");
    await key(input()!, "Escape");
    expect(onCommit).not.toHaveBeenCalled();
    expect(trigger()!.textContent).toBe("Ann");
    expect(document.activeElement).toBe(trigger());
  });

  test("no onCommit when the value is unchanged", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { onCommit }));
    await act(async () => trigger()!.click());
    await key(input()!, "Enter");
    expect(onCommit).not.toHaveBeenCalled();
    expect(input()).toBeNull();
  });

  test("commits on blur", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { onCommit }));
    await act(async () => trigger()!.click());
    await type(input()!, "Cara");
    await act(async () => input()!.blur());
    expect(onCommit).toHaveBeenCalledWith("Cara");
    expect(input()).toBeNull();
  });

  test("validation fails: stays in editing and shows the error (aria-invalid / describedby); the error clears after a change; blur reverts", async () => {
    const onCommit = vi.fn();
    const validate = (v: TableEditValue) => (v === "" ? "Name is required" : null);
    await mount(createElement(Harness, { onCommit, validate }));
    await act(async () => trigger()!.click());
    await type(input()!, "");
    await key(input()!, "Enter");
    expect(onCommit).not.toHaveBeenCalled();
    expect(input()).not.toBeNull();
    expect(input()!.getAttribute("aria-invalid")).toBe("true");
    const error = document.querySelector('[data-slot="table-edit-error"]')!;
    expect(error.textContent).toBe("Name is required");
    expect(error.getAttribute("role")).toBe("alert");
    expect(input()!.getAttribute("aria-describedby")).toBe(error.id);
    await type(input()!, "x");
    expect(document.querySelector('[data-slot="table-edit-error"]')).toBeNull();
    await type(input()!, "");
    await act(async () => input()!.blur());
    expect(onCommit).not.toHaveBeenCalled();
    expect(trigger()!.textContent).toBe("Ann"); // reverted
  });

  test("number: commits a number, empty text commits null", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { type: "number", initial: 5, onCommit }));
    await act(async () => trigger()!.click());
    expect(input()!.type).toBe("number");
    await type(input()!, "42");
    await key(input()!, "Enter");
    expect(onCommit).toHaveBeenLastCalledWith(42);
    await act(async () => trigger()!.click());
    await type(input()!, "");
    await key(input()!, "Enter");
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });

  test("select: shows the option label, picking an option commits", async () => {
    const onCommit = vi.fn();
    await mount(createElement(Harness, { type: "select", initial: "admin", onCommit }));
    expect(trigger()!.textContent).toBe("Admin");
    await act(async () => trigger()!.click());
    expect(document.querySelector('[data-slot="select-trigger"]')).not.toBeNull();
    const item = [...document.querySelectorAll<HTMLElement>('[data-slot="select-item"]')].find(
      (i) => i.textContent?.includes("Developer"),
    );
    expect(item).toBeDefined();
    await act(async () => item!.click());
    expect(onCommit).toHaveBeenCalledWith("dev");
  });
});

// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { QUERY_BUILDER_SLOTS } from "../src/contract.ts";
import { QueryBuilder } from "../src/index.ts";
import type { QueryField, QueryFilter } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = root = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}
const click = async (el: Element | null | undefined) => {
  await act(async () => (el as HTMLElement).click());
};
const buttonNamed = (text: string) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);

const FIELDS: QueryField[] = [
  { name: "name", label: "Name", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "paid", label: "Paid" },
      { value: "shipped", label: "Shipped" },
    ],
  },
  { name: "amount", label: "Amount", type: "number" },
];

const FILTER: QueryFilter = {
  logic: "and",
  items: [
    { field: "status", op: "eq", value: "paid" },
    {
      logic: "or",
      items: [
        { field: "name", op: "contains", value: "ada" },
        { field: "amount", op: "between", value: [10, 20] },
      ],
    },
  ],
};

describe("QueryBuilder", () => {
  test("every slot of the contract is written, and no class", () => {
    expect(QUERY_BUILDER_SLOTS).toContain("query-builder-chip");
    const html = renderToStaticMarkup(
      createElement(QueryBuilder, { fields: FIELDS, value: FILTER, onChange: () => {} }),
    );
    expect(html).toContain('data-slot="query-builder"');
    expect(html).toContain('data-slot="query-builder-chip"');
    expect(html).not.toContain("class=");
  });

  test("a chip says the condition in words; a group is one chip in brackets", async () => {
    const el = await mount(
      createElement(QueryBuilder, { fields: FIELDS, value: FILTER, onChange: () => {} }),
    );
    const chips = [...el.querySelectorAll('[data-slot="query-builder-chip"]')].map(
      (c) => c.textContent,
    );
    expect(chips).toEqual(["Status is Paid", "(Name contains ada or Amount between 10 – 20)"]);
    // two chips: the logic joining them can be changed
    expect(el.querySelector('[role="radiogroup"], [data-slot="segmented"]')).not.toBeNull();
  });

  test("removing a chip leaves the others; the last one leaves no filter", async () => {
    const onChange = vi.fn();
    const el = await mount(
      createElement(QueryBuilder, {
        fields: FIELDS,
        value: { field: "status", op: "eq", value: "paid" },
        onChange,
      }),
    );
    await click(el.querySelector('button[aria-label="Remove condition"]'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test("Filter adds a condition: pick the value, OK; incomplete rows are dropped", async () => {
    const onChange = vi.fn();
    const el = await mount(createElement(QueryBuilder, { fields: FIELDS, onChange }));
    await click(buttonNamed("Filter"));
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Value"]');
    expect(input).not.toBeNull();
    // OK with nothing typed adds nothing
    await click(buttonNamed("OK"));
    expect(onChange).not.toHaveBeenCalled();
    await click(buttonNamed("Filter"));
    const field = document.querySelector<HTMLInputElement>('input[aria-label="Value"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, "ada");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(buttonNamed("OK"));
    expect(onChange).toHaveBeenCalledWith({ field: "name", op: "contains", value: "ada" });
    expect(el).toBeTruthy();
  });

  test("capabilities: no `or` and no groups when the backend takes none", async () => {
    await mount(
      createElement(QueryBuilder, {
        fields: FIELDS,
        onChange: () => {},
        capabilities: { or: false, nested: false },
      }),
    );
    await click(buttonNamed("Filter"));
    expect(buttonNamed("Add condition")).toBeDefined();
    expect(buttonNamed("Add group")).toBeUndefined();
    await click(buttonNamed("Add condition"));
    expect(document.body.textContent).not.toContain("of these");
  });

  test("`labels` replace the texts", async () => {
    await mount(
      createElement(QueryBuilder, {
        fields: FIELDS,
        onChange: () => {},
        labels: { addCondition: "Filtrar" },
      }),
    );
    expect(buttonNamed("Filtrar")).toBeDefined();
  });
});

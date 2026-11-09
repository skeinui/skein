// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { DataTable } from "../src/index.ts";
import type { DataTableProps } from "../src/index.ts";

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
  // A test may mount again with other props: the earlier table goes first
  await act(async () => root?.unmount());
  host?.remove();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}

interface Person {
  id: string;
  name: string;
  role: string;
}
const ROWS: Person[] = [
  { id: "a", name: "Ada", role: "admin" },
  { id: "b", name: "Ben", role: "viewer" },
];
const make = (props: Partial<DataTableProps<Person>> = {}) =>
  createElement(DataTable<Person>, {
    columns: [
      { key: "name", title: "Name", sortable: true },
      { key: "role", title: "Role", render: (p) => `role: ${p.role}` },
    ],
    rows: ROWS,
    rowKey: "id",
    ...props,
  });
const click = async (el: Element | null | undefined) => {
  await act(async () => (el as HTMLElement).click());
};

describe("DataTable", () => {
  test("`stickyHeader` goes to the table's container (data-sticky), off by default", () => {
    expect(ssr(make())).not.toContain("data-sticky");
    expect(ssr(make({ stickyHeader: true }))).toContain("data-sticky");
  });

  test("SSR: a table with the titles, one row per item, a field shown as text and `render` used when given; no class / style", () => {
    const html = ssr(make());
    expect(html).toContain('data-slot="table"');
    expect(html).toContain("Name");
    expect(html).toContain("Ada");
    expect(html).toContain("role: viewer");
    expect(html.match(/data-slot="table-row"/g)).toHaveLength(3); // the header row and two rows
    expect(html).not.toMatch(/class=|style=/);
  });

  test("empty: the locale's text, or yours; loading says so and marks the table busy", () => {
    expect(ssr(make({ rows: [] }))).toContain("No data");
    expect(ssr(make({ rows: [], empty: "Nobody yet" }))).toContain("Nobody yet");
    const loading = ssr(make({ rows: [], loading: true }));
    expect(loading).toContain("Loading…");
    expect(loading).toContain('aria-busy="true"');
  });

  test("rowKey as a function; the selection column only when both `selected` and `onSelectedChange` are given", () => {
    expect(ssr(make({ rowKey: (p) => `k-${p.id}` }))).toContain("Ada");
    expect(ssr(make({ selected: [] }))).not.toContain('data-kind="select"');
    const html = ssr(make({ selected: ["a"], onSelectedChange: () => {} }));
    expect(html.match(/data-kind="select"/g)).toHaveLength(3); // the header and two rows
    expect(html).toContain('aria-label="Select all"');
    expect(html).toContain('aria-selected="true"');
  });

  test("selecting: the header box selects all or none, a row box toggles that row", async () => {
    const onSelectedChange = vi.fn();
    await mount(make({ selected: ["a"], onSelectedChange }));
    const boxes = [...document.querySelectorAll<HTMLElement>('[role="checkbox"]')];
    expect(boxes).toHaveLength(3);
    // some selected: the header is mixed; ticking it selects all
    expect(boxes[0]!.getAttribute("aria-checked")).toBe("mixed");
    await click(boxes[0]);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b"]);
    await click(boxes[2]); // Ben, not selected
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b"]);
    await click(boxes[1]); // Ada, selected
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
  });

  test("sorting: the button goes ascending, then descending, then none; the header carries aria-sort", async () => {
    const onSortChange = vi.fn();
    await mount(make({ onSortChange }));
    const button = () => document.querySelector<HTMLElement>('[data-slot="table-sort-button"]')!;
    await click(button());
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", order: "asc" });
    await mount(make({ onSortChange, sort: { key: "name", order: "asc" } }));
    expect(document.querySelector("th[aria-sort]")?.getAttribute("aria-sort")).toBe("ascending");
    await click(button());
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", order: "desc" });
    await mount(make({ onSortChange, sort: { key: "name", order: "desc" } }));
    await click(button());
    expect(onSortChange).toHaveBeenLastCalledWith(null);
  });

  test("actions: a column of buttons, falsy entries skipped, a plain one runs at once", async () => {
    const edit = vi.fn();
    const html = ssr(
      make({
        actions: (p) => [{ key: "edit", label: "Edit", onClick: () => {} }, p.id === "b" && false],
      }),
    );
    expect(html).toContain('aria-label="Actions"');
    expect(html.match(/>Edit</g)).toHaveLength(2);
    await mount(
      make({
        actions: (p) => [p.id === "a" && { key: "edit", label: "Edit", onClick: () => edit(p.id) }],
      }),
    );
    const buttons = [...document.querySelectorAll<HTMLElement>("tbody button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Edit"]); // only Ada's row has one
    await click(buttons[0]);
    expect(edit).toHaveBeenCalledWith("a");
  });

  test("actions with `confirm` ask first: nothing runs until the confirm button is pressed", async () => {
    const remove = vi.fn();
    await mount(
      make({
        actions: (p) => [
          {
            key: "delete",
            label: "Delete",
            color: "danger",
            confirm: `Delete ${p.name}?`,
            onClick: () => remove(p.id),
          },
        ],
      }),
    );
    await click(document.querySelector("tbody button"));
    expect(remove).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Delete Ada?");
    const confirm = [...document.querySelectorAll<HTMLElement>("button")].find(
      (b) => b.textContent === "Delete" && b.closest('[data-slot="popconfirm"]'),
    );
    await click(confirm);
    expect(remove).toHaveBeenCalledWith("a");
  });
});

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

describe("DataTable: current row and row click", () => {
  test("`activeKey` marks that row (data-active, aria-current) and says nothing about ticking; `nowrap` of a column goes on its cells and header", () => {
    const html = ssr(
      make({ activeKey: "b", columns: [{ key: "name", title: "Name", nowrap: true }] }),
    );
    expect(html.match(/data-active/g)).toHaveLength(1);
    expect(html).toContain('aria-current="true"');
    expect(html).not.toContain("aria-selected");
    expect(html.match(/data-nowrap/g)).toHaveLength(3);
    expect(ssr(make())).not.toContain("data-active");
  });

  test("without `onRowClick` the rows are not interactive; with it they are focusable rows", () => {
    expect(ssr(make())).not.toContain("data-interactive");
    const html = ssr(make({ onRowClick: () => {} }));
    expect(html).toContain("data-interactive");
    expect(html).toContain('tabindex="0"');
  });

  test("a click on a row calls onRowClick with the row and its index; Enter and Space on the focused row do too", async () => {
    const onRowClick = vi.fn();
    const el = await mount(make({ onRowClick }));
    const rows = el.querySelectorAll('tbody [data-slot="table-row"]');
    await click(rows[1]!.querySelector("td"));
    expect(onRowClick).toHaveBeenLastCalledWith(ROWS[1], 1);
    await act(async () => {
      rows[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(onRowClick).toHaveBeenLastCalledWith(ROWS[0], 0);
    await act(async () => {
      rows[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(onRowClick).toHaveBeenLastCalledWith(ROWS[1], 1);
    await act(async () => {
      rows[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  test("a click on a button, a link or the tick box inside the row, and Enter in them, is not a click on the row", async () => {
    const onRowClick = vi.fn();
    const onSelectedChange = vi.fn();
    const el = await mount(
      make({
        onRowClick,
        selected: [],
        onSelectedChange,
        columns: [
          {
            key: "name",
            title: "Name",
            render: (p) =>
              createElement("a", { href: "#x", "data-testid": `link-${p.id}` }, p.name),
          },
        ],
        actions: () => [{ key: "x", label: "Do", onClick: () => {} }],
      }),
    );
    await click(el.querySelector('[data-testid="link-a"]'));
    await click(el.querySelector("tbody button"));
    await click(el.querySelector('tbody [role="checkbox"], tbody input[type="checkbox"]'));
    expect(onRowClick).not.toHaveBeenCalled();
    const link = el.querySelector('[data-testid="link-a"]')!;
    await act(async () => {
      link.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(onRowClick).not.toHaveBeenCalled();
  });
});

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

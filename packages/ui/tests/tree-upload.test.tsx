// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Tree, Upload } from "../src/index.ts";
import type { TreeNode, UploadFile } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const NODES: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "a", label: "a.ts" },
      { id: "b", label: "b.ts" },
      { id: "c", label: "c.ts", disabled: true },
    ],
  },
  { id: "readme", label: "README" },
];

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
const row = (h: HTMLElement, id: string) => h.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!;

describe("Tree", () => {
  test("SSR: roles, levels, no class / style", () => {
    const html = ssr(createElement(Tree, { nodes: NODES, defaultExpanded: ["src"] }));
    expect(html).toContain('role="tree"');
    expect(html).toContain('role="treeitem"');
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-level="2"');
    expect(html).toContain('data-slot="tree-toggle"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("collapsed nodes don't render children", () => {
    const html = ssr(createElement(Tree, { nodes: NODES }));
    expect(html).not.toContain("a.ts");
    expect(html).toContain('aria-expanded="false"');
  });

  test("clicking the arrow expands, clicking the row selects", () => {
    const h = mount(createElement(Tree, { nodes: NODES }));
    expect(h.textContent).not.toContain("a.ts");
    click(h.querySelector('[data-slot="tree-toggle"]')!);
    expect(h.textContent).toContain("a.ts");
    click(row(h, "a"));
    expect(h.querySelector('[data-selected] [data-node-id="a"]')).not.toBeNull();
    expect(
      h.querySelector('[data-node-id="a"]')!.closest("li")!.getAttribute("aria-selected"),
    ).toBe("true");
  });

  test("clicking a row with children also expands / collapses it; only selects with expandOnClick=false; disabled ones do nothing", () => {
    const h = mount(createElement(Tree, { nodes: NODES }));
    click(row(h, "src"));
    expect(h.textContent).toContain("a.ts");
    expect(row(h, "src").closest("li")!.hasAttribute("data-selected")).toBe(true);
    click(row(h, "src"));
    expect(h.textContent).not.toContain("a.ts");
    act(() => root?.unmount());
    host?.remove();

    const h2 = mount(createElement(Tree, { nodes: NODES, expandOnClick: false }));
    click(row(h2, "src"));
    expect(h2.textContent).not.toContain("a.ts");
    expect(row(h2, "src").closest("li")!.hasAttribute("data-selected")).toBe(true);
    click(h2.querySelector('[data-slot="tree-toggle"]')!);
    expect(h2.textContent).toContain("a.ts");
  });

  test("onSelectedChange / onExpandedChange fire, disabled nodes can't be selected", () => {
    const selected: Array<string | null> = [];
    const expanded: string[][] = [];
    const h = mount(
      createElement(Tree, {
        nodes: NODES,
        defaultExpanded: ["src"],
        onSelectedChange: (id: string | null) => selected.push(id),
        onExpandedChange: (ids: string[]) => expanded.push(ids),
      }),
    );
    click(row(h, "c"));
    expect(selected).toEqual([]);
    click(row(h, "b"));
    expect(selected).toEqual(["b"]);
    click(h.querySelector('[data-slot="tree-toggle"]')!);
    expect(expanded).toEqual([[]]);
  });

  test("keyboard: up / down move, right expands, left collapses, Enter selects", () => {
    const h = mount(createElement(Tree, { nodes: NODES }));
    const src = row(h, "src");
    act(() => src.focus());
    key(src, "ArrowRight");
    expect(h.textContent).toContain("a.ts");
    key(src, "ArrowDown");
    expect(document.activeElement).toBe(row(h, "a"));
    key(row(h, "a"), "Enter");
    expect(row(h, "a").closest("li")!.hasAttribute("data-selected")).toBe(true);
    key(row(h, "a"), "ArrowLeft");
    expect(document.activeElement).toBe(row(h, "src"));
    key(row(h, "src"), "ArrowLeft");
    expect(h.textContent).not.toContain("a.ts");
    key(row(h, "src"), "End");
    expect(document.activeElement).toBe(row(h, "readme"));
    key(row(h, "readme"), "Home");
    expect(document.activeElement).toBe(row(h, "src"));
  });

  test("icon can be a function that switches by expanded / selected / leaf state", () => {
    const nodes: TreeNode[] = [
      {
        id: "dir",
        label: "dir",
        icon: ({ expanded, selected }) =>
          createElement("i", { "data-icon": `dir-${expanded ? "open" : "closed"}-${selected}` }),
        children: [
          {
            id: "f",
            label: "f",
            icon: ({ leaf }) => createElement("i", { "data-icon": `file-${leaf}` }),
          },
        ],
      },
      { id: "plain", label: "plain", icon: createElement("i", { "data-icon": "static" }) },
    ];
    const h = mount(createElement(Tree, { nodes, expandOnClick: false }));
    expect(h.querySelector('[data-icon="dir-closed-false"]')).not.toBeNull();
    expect(h.querySelector('[data-icon="static"]')).not.toBeNull();
    click(h.querySelector('[data-slot="tree-toggle"]')!);
    expect(h.querySelector('[data-icon="dir-open-false"]')).not.toBeNull();
    expect(h.querySelector('[data-icon="file-true"]')).not.toBeNull();
    click(row(h, "dir"));
    expect(h.querySelector('[data-icon="dir-open-true"]')).not.toBeNull();
  });

  test("a single tab stop (roving tabindex)", () => {
    const h = mount(createElement(Tree, { nodes: NODES, defaultExpanded: ["src"] }));
    const stops = [...h.querySelectorAll('[data-slot="tree-row"]')].filter(
      (r) => r.getAttribute("tabindex") === "0",
    );
    expect(stops).toHaveLength(1);
  });

  test("checkable: checking a parent checks its enabled descendants, skips disabled ones, parents become indeterminate / checked", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Tree, {
        nodes: NODES,
        checkable: true,
        defaultExpanded: ["src"],
        onCheckedChange: (ids: string[]) => changes.push([...ids].sort()),
      }),
    );
    const boxes = () => [...h.querySelectorAll<HTMLElement>('[role="checkbox"]')];
    // Order: src, a, b, c(disabled), readme
    click(boxes()[1]!);
    expect(changes.at(-1)).toEqual(["a"]);
    expect(boxes()[0]!.getAttribute("aria-checked")).toBe("mixed");
    click(boxes()[2]!);
    expect(changes.at(-1)).toEqual(["a", "b", "src"]);
    expect(boxes()[0]!.getAttribute("aria-checked")).toBe("true");
    click(boxes()[0]!);
    expect(changes.at(-1)).toEqual([]);
  });

  test("controlled checked", () => {
    function Controlled() {
      const [checked, setChecked] = useState<string[]>(["readme"]);
      return createElement(Tree, {
        nodes: NODES,
        checkable: true,
        checked,
        onCheckedChange: setChecked,
      });
    }
    const h = mount(createElement(Controlled));
    const box = h.querySelectorAll<HTMLElement>('[role="checkbox"]')[1]!;
    expect(box.getAttribute("aria-checked")).toBe("true");
  });
});

describe("Upload", () => {
  test("SSR: default dropzone structure, no class / style", () => {
    const html = ssr(createElement(Upload, { hint: "PNG up to 2 MB" }));
    expect(html).toContain('data-slot="upload"');
    expect(html).toContain('data-variant="dropzone"');
    expect(html).toContain('role="button"');
    expect(html).toContain('data-slot="upload-hint"');
    expect(html).not.toContain("upload-list");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("the button variant renders a native button, disabled on the root", () => {
    const html = ssr(createElement(Upload, { variant: "button", disabled: true }));
    expect(html).toContain("<button");
    expect(html).toContain('data-variant="button"');
    expect(html).toMatch(/data-slot="upload"[^>]*data-disabled/);
  });

  test("file list: status, size, progress, error, action buttons", () => {
    const files: UploadFile[] = [
      { id: "1", name: "a.png", size: 2048, status: "done" },
      { id: "2", name: "b.png", size: 5 * 1024 * 1024, status: "uploading", progress: 40 },
      { id: "3", name: "c.png", status: "error", error: "Too large" },
    ];
    const html = ssr(createElement(Upload, { files, onRemove: () => {}, onRetry: () => {} }));
    expect(html).toContain('data-status="done"');
    expect(html).toContain('data-status="uploading"');
    expect(html).toContain("2.0 KB");
    expect(html).toContain("5.0 MB · 40%");
    expect(html).toContain('data-slot="upload-item-progress"');
    expect(html).toContain("Too large");
    expect(html.match(/data-action="retry"/g)).toHaveLength(1);
    expect(html.match(/data-action="remove"/g)).toHaveLength(3);
  });

  test("dropping files calls onFilesAdded; only the first without multiple; data-dragging while dragging", () => {
    const got: File[][] = [];
    const h = mount(createElement(Upload, { onFilesAdded: (f: File[]) => got.push(f) }));
    const zone = h.querySelector('[data-slot="upload-trigger"]')!;
    const files = [new File(["a"], "a.txt"), new File(["b"], "b.txt")];
    act(() => {
      zone.dispatchEvent(new Event("dragover", { bubbles: true, cancelable: true }));
    });
    expect(h.querySelector("[data-dragging]")).not.toBeNull();
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files } });
    act(() => {
      zone.dispatchEvent(drop);
    });
    expect(h.querySelector("[data-dragging]")).toBeNull();
    expect(got).toHaveLength(1);
    expect(got[0]!.map((f) => f.name)).toEqual(["a.txt"]);
  });

  test("all files with multiple; dropping does nothing when disabled", () => {
    const got: File[][] = [];
    const h = mount(
      createElement(Upload, { multiple: true, onFilesAdded: (f: File[]) => got.push(f) }),
    );
    const files = [new File(["a"], "a.txt"), new File(["b"], "b.txt")];
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files } });
    act(() => {
      h.querySelector('[data-slot="upload-trigger"]')!.dispatchEvent(drop);
    });
    expect(got[0]).toHaveLength(2);

    const got2: File[][] = [];
    const h2 = mount(
      createElement(Upload, { disabled: true, onFilesAdded: (f: File[]) => got2.push(f) }),
    );
    const drop2 = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop2, "dataTransfer", { value: { files } });
    act(() => {
      h2.querySelector('[data-slot="upload-trigger"]')!.dispatchEvent(drop2);
    });
    expect(got2).toHaveLength(0);
  });

  test("remove / retry callbacks get the file id", () => {
    const removed: string[] = [];
    const retried: string[] = [];
    const h = mount(
      createElement(Upload, {
        files: [{ id: "x", name: "x.png", status: "error" as const }],
        onRemove: (id: string) => removed.push(id),
        onRetry: (id: string) => retried.push(id),
      }),
    );
    click(h.querySelector('[data-action="retry"]')!);
    click(h.querySelector('[data-action="remove"]')!);
    expect(retried).toEqual(["x"]);
    expect(removed).toEqual(["x"]);
  });
});

describe("Timeline", () => {
  test("SSR: list structure, colors, no class / style", async () => {
    const { Timeline } = await import("../src/index.ts");
    const html = ssr(
      createElement(Timeline, {
        items: [
          { title: "Created", time: "09:00" },
          { title: "Paid", description: "by card", color: "success" },
          { title: "Shipping", pending: true },
        ],
      }),
    );
    expect(html).toContain("<ol");
    expect(html.match(/data-slot="timeline-item"/g)).toHaveLength(3);
    expect(html).toContain("data-has-time");
    expect(html).toContain('data-color="primary"');
    expect(html).toContain('data-color="success"');
    expect(html).toContain("data-pending");
    expect(html).toContain('aria-current="step"');
    // No connector line is drawn after the last item
    expect(html.match(/data-slot="timeline-connector"/g)).toHaveLength(2);
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("no time column without times", async () => {
    const { Timeline } = await import("../src/index.ts");
    const html = ssr(createElement(Timeline, { items: [{ title: "a" }, { title: "b" }] }));
    expect(html).not.toContain("timeline-time");
    expect(html).not.toContain("data-has-time");
  });
});

describe("Tree async loading", () => {
  test("lazy nodes show an arrow, expanding calls onLoadChildren, data-loading while loading, then children are filled in", async () => {
    const calls: string[] = [];
    let release: () => void = () => {};
    function Demo() {
      const [nodes, setNodes] = useState<TreeNode[]>([
        { id: "remote", label: "remote", lazy: true },
      ]);
      return createElement(Tree, {
        nodes,
        onLoadChildren: (id: string) => {
          calls.push(id);
          return new Promise<void>((resolve) => {
            release = () => {
              setNodes([{ id: "remote", label: "remote", children: [{ id: "x", label: "x.ts" }] }]);
              resolve();
            };
          });
        },
      });
    }
    const h = mount(createElement(Demo));
    const item = () => h.querySelector('[data-slot="tree-item"]')!;
    expect(item().getAttribute("aria-expanded")).toBe("false");
    click(row(h, "remote"));
    expect(calls).toEqual(["remote"]);
    expect(item().hasAttribute("data-loading")).toBe(true);
    expect(item().getAttribute("aria-busy")).toBe("true");
    expect(h.querySelector('[data-slot="tree-spinner"]')).not.toBeNull();
    await act(async () => {
      release();
    });
    expect(item().hasAttribute("data-loading")).toBe(false);
    expect(h.textContent).toContain("x.ts");
    // Collapse then expand: children already exist, no more loading
    click(row(h, "remote"));
    click(row(h, "remote"));
    expect(calls).toEqual(["remote"]);
  });

  test("repeated clicks while loading don't load again; the Right key also loads", async () => {
    const calls: string[] = [];
    const h = mount(
      createElement(Tree, {
        nodes: [{ id: "a", label: "a", lazy: true }],
        expandOnClick: false,
        onLoadChildren: (id: string) => {
          calls.push(id);
          return new Promise<void>(() => {});
        },
      }),
    );
    act(() => row(h, "a").focus());
    key(row(h, "a"), "ArrowRight");
    expect(calls).toEqual(["a"]);
    key(row(h, "a"), "ArrowLeft");
    key(row(h, "a"), "ArrowRight");
    expect(calls).toEqual(["a"]);
  });
});

describe("Upload file type badge", () => {
  test("data-ext from the extension, none for no or too long extensions", () => {
    const html = ssr(
      createElement(Upload, {
        files: [
          { id: "1", name: "report.PDF", status: "done" as const },
          { id: "2", name: "Makefile", status: "done" as const },
          { id: "3", name: "archive.tar.gzzzz", status: "done" as const },
        ],
      }),
    );
    expect(html).toContain('data-ext="pdf"');
    expect(html.match(/data-slot="upload-item-ext"/g)).toHaveLength(1);
  });
});

describe("Rating", () => {
  test("SSR: slider semantics, max stars, half-star fill, no class / style", async () => {
    const { Rating } = await import("../src/index.ts");
    const html = ssr(createElement(Rating, { defaultValue: 3.5, allowHalf: true, name: "score" }));
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="3.5"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html.match(/data-slot="rating-item"/g)).toHaveLength(5);
    expect(html.match(/data-fill="full"/g)).toHaveLength(3);
    expect(html.match(/data-fill="half"/g)).toHaveLength(1);
    expect(html).toContain('<input type="hidden" name="score" value="3.5"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("clicking sets the value, clicking it again clears; the left half sets a half star", async () => {
    const { Rating } = await import("../src/index.ts");
    const changes: number[] = [];
    const h = mount(
      createElement(Rating, { allowHalf: true, onValueChange: (v: number) => changes.push(v) }),
    );
    const hits = () => [...h.querySelectorAll<HTMLElement>('[data-slot="rating-hit"]')];
    // Each star has two hit areas: half first, then whole
    click(hits()[4]!); // half of the third star
    expect(changes.at(-1)).toBe(2.5);
    click(hits()[5]!); // the whole third star
    expect(changes.at(-1)).toBe(3);
    click(hits()[5]!);
    expect(changes.at(-1)).toBe(0);
  });

  test("keyboard: left / right adjust, Home / End, stops at the bounds", async () => {
    const { Rating } = await import("../src/index.ts");
    const h = mount(createElement(Rating, { defaultValue: 2 }));
    const slider = h.querySelector<HTMLElement>('[role="slider"]')!;
    key(slider, "ArrowRight");
    expect(slider.getAttribute("aria-valuenow")).toBe("3");
    key(slider, "End");
    key(slider, "ArrowRight");
    expect(slider.getAttribute("aria-valuenow")).toBe("5");
    key(slider, "Home");
    key(slider, "ArrowLeft");
    expect(slider.getAttribute("aria-valuenow")).toBe("0");
  });

  test("readOnly / disabled: no response, no hit areas, not in the tab order", async () => {
    const { Rating } = await import("../src/index.ts");
    const changes: number[] = [];
    const h = mount(
      createElement(Rating, {
        defaultValue: 2,
        readOnly: true,
        onValueChange: (v: number) => changes.push(v),
      }),
    );
    const slider = h.querySelector<HTMLElement>('[role="slider"]')!;
    expect(h.querySelector('[data-slot="rating-hit"]')).toBeNull();
    expect(slider.getAttribute("tabindex")).toBe("-1");
    key(slider, "ArrowRight");
    expect(changes).toEqual([]);
    expect(slider.hasAttribute("data-readonly")).toBe(true);
  });

  test("controlled value", async () => {
    const { Rating } = await import("../src/index.ts");
    const h = mount(createElement(Rating, { value: 4 }));
    expect(h.querySelector('[role="slider"]')!.getAttribute("aria-valuenow")).toBe("4");
    key(h.querySelector('[role="slider"]')!, "ArrowLeft");
    // When controlled, the internal state doesn't change
    expect(h.querySelector('[role="slider"]')!.getAttribute("aria-valuenow")).toBe("4");
  });
});

describe("Segmented", () => {
  test("SSR: radiogroup, selected item, string options, no class / style", async () => {
    const { Segmented } = await import("../src/index.ts");
    const html = ssr(
      createElement(Segmented, {
        "aria-label": "View",
        options: ["A", "B", { value: "c", label: "C", disabled: true }],
        defaultValue: "B",
        name: "view",
      }),
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(html.match(/data-selected/g)).toHaveLength(1);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('<input type="hidden" name="view" value="B"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("clicking selects and calls back; the parent decides when controlled", async () => {
    const { Segmented } = await import("../src/index.ts");
    const changes: string[] = [];
    const h = mount(
      createElement(Segmented, {
        options: ["A", "B", "C"],
        defaultValue: "A",
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    const items = () => [...h.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')];
    click(items()[2]!);
    expect(changes).toEqual(["C"]);
    expect(items()[2]!.getAttribute("aria-checked")).toBe("true");
    click(items()[2]!); // clicking the same item again doesn't call back
    expect(changes).toEqual(["C"]);
  });

  test("keyboard: arrows move and select, skip disabled items, wrap; only the selected item is in the tab order", async () => {
    const { Segmented } = await import("../src/index.ts");
    const h = mount(
      createElement(Segmented, {
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
          { value: "c", label: "C" },
        ],
        defaultValue: "a",
      }),
    );
    const items = () => [...h.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')];
    expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1]);
    key(items()[0]!, "ArrowRight"); // skips the disabled b
    expect(items()[2]!.getAttribute("aria-checked")).toBe("true");
    expect(items().map((i) => i.tabIndex)).toEqual([-1, -1, 0]);
    key(items()[2]!, "ArrowRight"); // wraps back to a
    expect(items()[0]!.getAttribute("aria-checked")).toBe("true");
    key(items()[0]!, "End");
    expect(items()[2]!.getAttribute("aria-checked")).toBe("true");
    key(items()[2]!, "Home");
    expect(items()[0]!.getAttribute("aria-checked")).toBe("true");
  });

  test("fully disabled: ignores clicks and keys, no item in the tab order", async () => {
    const { Segmented } = await import("../src/index.ts");
    const changes: string[] = [];
    const h = mount(
      createElement(Segmented, {
        options: ["A", "B"],
        defaultValue: "A",
        disabled: true,
        onValueChange: (v: string) => changes.push(v),
      }),
    );
    const items = [...h.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')];
    click(items[1]!);
    key(items[0]!, "ArrowRight");
    expect(changes).toEqual([]);
    expect(items.every((i) => i.tabIndex === -1)).toBe(true);
  });

  test("data-empty when no value matches, the thumb position variables are on the root", async () => {
    const { Segmented } = await import("../src/index.ts");
    const h = mount(createElement(Segmented, { options: ["A", "B"] }));
    expect(h.querySelector('[data-slot="segmented"]')!.hasAttribute("data-empty")).toBe(true);
  });
});

describe("Tree search filter", () => {
  const TREE: TreeNode[] = [
    {
      id: "src",
      label: "src",
      children: [
        { id: "app", label: "App.tsx" },
        { id: "lib", label: "lib", children: [{ id: "util", label: "util.ts" }] },
      ],
    },
    { id: "docs", label: "docs", children: [{ id: "guide", label: "guide.md" }] },
    { id: "readme", label: "README" },
  ];
  const ids = (h: HTMLElement) =>
    [...h.querySelectorAll<HTMLElement>("[data-node-id]")].map((e) => e.dataset.nodeId);

  test("matches and their ancestors stay, the rest are hidden, expanded down to the matches with highlighted text", () => {
    const h = mount(createElement(Tree, { nodes: TREE, filter: "util" }));
    expect(ids(h)).toEqual(["src", "lib", "util"]);
    expect(row(h, "util").hasAttribute("data-match")).toBe(true);
    expect(row(h, "src").hasAttribute("data-match")).toBe(false);
    expect(h.querySelector("mark")!.textContent).toBe("util");
    expect(h.querySelector('[data-slot="tree"]')!.hasAttribute("data-filtering")).toBe(true);
  });

  test("descendants of matches show too (once expanded); case-insensitive", () => {
    const h = mount(createElement(Tree, { nodes: TREE, filter: "LIB", defaultExpanded: ["lib"] }));
    expect(ids(h)).toEqual(["src", "lib", "util"]);
  });

  test("no matches: shows emptyText; clearing the query restores, the expanded state isn't overwritten", () => {
    const h = mount(createElement(Tree, { nodes: TREE, filter: "zzz", emptyText: "Nothing" }));
    expect(h.querySelector('[data-slot="tree-empty"]')!.textContent).toBe("Nothing");
    expect(ids(h)).toEqual([]);
    act(() => root!.render(createElement(Tree, { nodes: TREE, filter: "" })));
    expect(ids(h)).toEqual(["src", "docs", "readme"]);
  });

  test("filterMode=highlight: keeps everything, only expands to and marks the matches", () => {
    const h = mount(createElement(Tree, { nodes: TREE, filter: "guide", filterMode: "highlight" }));
    expect(ids(h)).toEqual(["src", "docs", "guide", "readme"]);
    expect(row(h, "guide").hasAttribute("data-match")).toBe(true);
  });

  test("custom filterNode: used as is, no text highlight", () => {
    const h = mount(
      createElement(Tree, {
        nodes: TREE,
        filter: "x",
        filterNode: (n: TreeNode) => n.id === "readme",
      }),
    );
    expect(ids(h)).toEqual(["readme"]);
    expect(h.querySelector("mark")).toBeNull();
  });

  test("a node collapsed by hand during a search stays collapsed; expands again when the query changes", () => {
    const h = mount(createElement(Tree, { nodes: TREE, filter: "util" }));
    click(h.querySelector('[data-node-id="lib"] [data-slot="tree-toggle"]')!);
    expect(ids(h)).toEqual(["src", "lib"]);
    act(() => root!.render(createElement(Tree, { nodes: TREE, filter: "uti" })));
    expect(ids(h)).toEqual(["src", "lib", "util"]);
  });
});

describe("moveTreeNode", () => {
  const T: TreeNode[] = [
    { id: "a", label: "a", children: [{ id: "a1", label: "a1" }] },
    { id: "b", label: "b" },
    { id: "c", label: "c" },
  ];
  const shape = (list: TreeNode[]): unknown =>
    list.map((n) => (n.children ? { [n.id]: shape(n.children) } : n.id));

  test("before / after / inside, across levels", async () => {
    const { moveTreeNode } = await import("../src/index.ts");
    expect(shape(moveTreeNode(T, { id: "c", targetId: "a", position: "before" }))).toEqual([
      "c",
      { a: ["a1"] },
      "b",
    ]);
    expect(shape(moveTreeNode(T, { id: "a1", targetId: "c", position: "after" }))).toEqual([
      { a: [] },
      "b",
      "c",
      "a1",
    ]);
    expect(shape(moveTreeNode(T, { id: "b", targetId: "a", position: "inside" }))).toEqual([
      { a: ["a1", "b"] },
      "c",
    ]);
    expect(shape(moveTreeNode(T, { id: "b", targetId: "c", position: "inside" }))).toEqual([
      { a: ["a1"] },
      { c: ["b"] },
    ]);
  });

  test("doesn't mutate the data; returns it as is when moving into itself or a descendant or the target doesn't exist", async () => {
    const { moveTreeNode } = await import("../src/index.ts");
    const before = JSON.stringify(T);
    moveTreeNode(T, { id: "b", targetId: "a", position: "before" });
    expect(JSON.stringify(T)).toBe(before);
    expect(moveTreeNode(T, { id: "a", targetId: "a1", position: "inside" })).toBe(T);
    expect(moveTreeNode(T, { id: "a", targetId: "a", position: "after" })).toBe(T);
    expect(moveTreeNode(T, { id: "b", targetId: "nope", position: "after" })).toBe(T);
  });
});

describe("Tree drag and drop", () => {
  const T: TreeNode[] = [
    { id: "a", label: "a", children: [{ id: "a1", label: "a1" }] },
    { id: "b", label: "b" },
    { id: "c", label: "c", disabled: true },
  ];
  /** Simulate a drag and drop: row height 40, clientY decides whether it lands on the top / middle / bottom. */
  const drag = (el: HTMLElement, type: string, y = 20) =>
    act(() => {
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 40);
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y }));
    });

  test("draggable attribute only with draggable; disabled nodes can't be dragged", () => {
    const h = mount(createElement(Tree, { nodes: T, draggable: true }));
    expect(row(h, "b").getAttribute("draggable")).toBe("true");
    expect(row(h, "c").hasAttribute("draggable")).toBe(false);
    act(() => root!.render(createElement(Tree, { nodes: T })));
    expect(row(h, "b").hasAttribute("draggable")).toBe(false);
  });

  test("dragging over a target shows a drop hint by position, dropping calls onMove", () => {
    const moves: unknown[] = [];
    const h = mount(
      createElement(Tree, { nodes: T, draggable: true, onMove: (m: unknown) => moves.push(m) }),
    );
    drag(row(h, "b"), "dragstart");
    expect(row(h, "b").parentElement!.hasAttribute("data-dragging")).toBe(true);
    drag(row(h, "a"), "dragover", 5);
    expect(row(h, "a").getAttribute("data-drop")).toBe("before");
    drag(row(h, "a"), "dragover", 35);
    expect(row(h, "a").getAttribute("data-drop")).toBe("after");
    drag(row(h, "a"), "dragover", 20);
    expect(row(h, "a").getAttribute("data-drop")).toBe("inside");
    drag(row(h, "a"), "drop", 20);
    expect(moves).toEqual([{ id: "b", targetId: "a", position: "inside" }]);
    expect(row(h, "a").hasAttribute("data-drop")).toBe(false);
    expect(h.querySelector("[data-dragging] > [data-node-id]")).toBeNull();
  });

  test("dropping inside a node expands it", () => {
    const h = mount(createElement(Tree, { nodes: T, draggable: true, onMove: () => {} }));
    drag(row(h, "b"), "dragstart");
    drag(row(h, "a"), "dragover", 20);
    drag(row(h, "a"), "drop", 20);
    expect(row(h, "a").parentElement!.getAttribute("aria-expanded")).toBe("true");
  });

  test("no drop on itself, its descendants, disabled nodes or positions allowDrop refuses: no hint, no callback", () => {
    const moves: unknown[] = [];
    const h = mount(
      createElement(Tree, {
        nodes: T,
        draggable: true,
        defaultExpanded: ["a"],
        onMove: (m: unknown) => moves.push(m),
        allowDrop: (m: { targetId: string }) => m.targetId !== "b",
      }),
    );
    drag(row(h, "a"), "dragstart");
    drag(row(h, "a"), "dragover");
    expect(row(h, "a").hasAttribute("data-drop")).toBe(false); // itself
    drag(row(h, "a1"), "dragover");
    expect(row(h, "a1").hasAttribute("data-drop")).toBe(false); // its own descendant
    drag(row(h, "c"), "dragover");
    expect(row(h, "c").hasAttribute("data-drop")).toBe(false); // disabled
    drag(row(h, "b"), "dragover");
    expect(row(h, "b").hasAttribute("data-drop")).toBe(false); // refused by allowDrop
    drag(row(h, "b"), "drop");
    expect(moves).toEqual([]);
  });

  test("dragend clears the drag state", () => {
    const h = mount(createElement(Tree, { nodes: T, draggable: true }));
    drag(row(h, "b"), "dragstart");
    expect(h.querySelector('[data-slot="tree"]')!.hasAttribute("data-dragging")).toBe(true);
    drag(row(h, "b"), "dragend");
    expect(h.querySelector('[data-slot="tree"]')!.hasAttribute("data-dragging")).toBe(false);
    expect(h.querySelector("[data-dragging]")).toBeNull();
  });

  test("Alt + ↑ / ↓ moves one place among siblings, not past the edge or a disabled node", () => {
    const moves: unknown[] = [];
    const h = mount(
      createElement(Tree, { nodes: T, draggable: true, onMove: (m: unknown) => moves.push(m) }),
    );
    const altKey = (el: Element, k: string) =>
      act(() => {
        el.dispatchEvent(
          new KeyboardEvent("keydown", { key: k, altKey: true, bubbles: true, cancelable: true }),
        );
      });
    altKey(row(h, "b"), "ArrowUp");
    expect(moves).toEqual([{ id: "b", targetId: "a", position: "before" }]);
    altKey(row(h, "a"), "ArrowUp"); // already first
    altKey(row(h, "b"), "ArrowDown"); // the next one is the disabled c
    expect(moves).toHaveLength(1);
    act(() =>
      root!.render(createElement(Tree, { nodes: T, onMove: (m: unknown) => moves.push(m) })),
    );
    altKey(row(h, "b"), "ArrowUp"); // draggable is off
    expect(moves).toHaveLength(1);
  });
});

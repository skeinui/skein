// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { KeepAlive } from "../src/index.ts";
import type { KeepAliveProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

/** Each page has its own counter: whether state is kept is judged by the count. */
function Page({ name }: { name: string }) {
  const [n, setN] = useState(0);
  return createElement(
    "button",
    { type: "button", "data-page": name, onClick: () => setN((v) => v + 1) },
    `${name}:${n}`,
  );
}

let render: (props: Partial<KeepAliveProps> & { activeKey: string }) => Promise<void>;
async function mount(first: Partial<KeepAliveProps> & { activeKey: string }) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  render = (props) =>
    act(async () =>
      root!.render(createElement(KeepAlive, props, createElement(Page, { name: props.activeKey }))),
    );
  await render(first);
}
const q = (s: string) => host!.querySelector<HTMLElement>(s);
const qa = (s: string) => [...host!.querySelectorAll<HTMLElement>(s)];
const page = (name: string) => q(`[data-page="${name}"]`);
const pane = (name: string) =>
  qa('[data-slot="keep-alive-pane"]').find((p) => p.dataset.key === name);
const visible = (name: string) =>
  pane(name)!.closest<HTMLElement>("[style]")?.style.display !== "none" &&
  getComputedStyle(pane(name)!).display !== "none";
const clickPage = (name: string) =>
  act(async () => void page(name)!.dispatchEvent(new MouseEvent("click", { bubbles: true })));

describe("<KeepAlive />", () => {
  test("switching away and back: the count is kept; the inactive item is hidden (not unmounted), the current one has data-active", async () => {
    await mount({ activeKey: "a" });
    await clickPage("a");
    await clickPage("a");
    expect(page("a")!.textContent).toBe("a:2");
    await render({ activeKey: "b" });
    expect(page("b")!.textContent).toBe("b:0");
    expect(qa('[data-slot="keep-alive-pane"]')).toHaveLength(2);
    expect(pane("b")!.hasAttribute("data-active")).toBe(true);
    expect(pane("a")!.hasAttribute("data-active")).toBe(false);
    expect(visible("a")).toBe(false);
    await render({ activeKey: "a" });
    expect(page("a")!.textContent).toBe("a:2");
    expect(visible("a")).toBe(true);
    expect(visible("b")).toBe(false);
  });

  test("DOM order follows first appearance and does not change on switch", async () => {
    await mount({ activeKey: "a" });
    await render({ activeKey: "b" });
    await render({ activeKey: "c" });
    await render({ activeKey: "a" });
    expect(qa('[data-slot="keep-alive-pane"]').map((p) => p.dataset.key)).toEqual(["a", "b", "c"]);
  });

  test("keepKeys: items not in it are dropped (state cleared), the current item is unaffected", async () => {
    await mount({ activeKey: "a", keepKeys: ["a", "b"] });
    await render({ activeKey: "b", keepKeys: ["a", "b"] });
    await render({ activeKey: "c", keepKeys: ["a", "b"] }); // c is not in the list but is still shown
    expect(
      qa('[data-slot="keep-alive-pane"]')
        .map((p) => p.dataset.key ?? "")
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(["a", "b", "c"]);
    await clickPage("c");
    await render({ activeKey: "a", keepKeys: ["a"] }); // b and c are closed
    expect(qa('[data-slot="keep-alive-pane"]').map((p) => p.dataset.key)).toEqual(["a"]);
    await render({ activeKey: "c", keepKeys: ["a", "c"] });
    expect(page("c")!.textContent).toBe("c:0"); // starts over
  });

  test("max: beyond it drops the least recently viewed, the current item always stays", async () => {
    await mount({ activeKey: "a", max: 2 });
    await render({ activeKey: "b", max: 2 });
    await render({ activeKey: "a", max: 2 }); // most recent: b, a
    await render({ activeKey: "c", max: 2 }); // drops b, the least recently viewed
    expect(qa('[data-slot="keep-alive-pane"]').map((p) => p.dataset.key)).toEqual(["a", "c"]);
  });

  test("versions: bumping one remounts that item, the others stay", async () => {
    await mount({ activeKey: "a" });
    await clickPage("a");
    await render({ activeKey: "b" });
    await clickPage("b");
    await render({ activeKey: "a", versions: { a: 1 } });
    expect(page("a")!.textContent).toBe("a:0");
    expect(page("b")!.textContent).toBe("b:1");
  });

  test("switching back restores that item's scroll position", async () => {
    await mount({ activeKey: "a" });
    const a = pane("a")!;
    a.scrollTop = 80;
    await act(async () => void a.dispatchEvent(new Event("scroll")));
    await render({ activeKey: "b" });
    a.scrollTop = 0; // browsers drop the scroll position of hidden elements
    await render({ activeKey: "a" });
    expect(pane("a")!.scrollTop).toBe(80);
  });

  test("transition goes on the root; other props pass through", async () => {
    await mount({ activeKey: "a", transition: "slide-up", id: "ka" } as never);
    expect(q('[data-slot="keep-alive"]')!.getAttribute("data-transition")).toBe("slide-up");
    expect(q("#ka")).not.toBeNull();
  });
});

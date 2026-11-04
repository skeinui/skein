// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { Affix } from "../src/index.ts";
import type { AffixProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
let box: HTMLElement;
/** Current top of the placeholder element relative to the viewport: tests use it to simulate scrolling. */
let naturalTop = 300;
const HEIGHT = 40;
const shift = { x: 0, y: 0 };

beforeEach(() => {
  naturalTop = 300;
  shift.x = 0;
  shift.y = 0;
  box = document.createElement("div");
  box.getBoundingClientRect = () => new DOMRect(10, 100, 400, 200); // container: 100 ~ 300 in the viewport
  document.body.appendChild(box);
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  box.remove();
  root = null;
  host = null;
});

function mount(props: Partial<AffixProps> = {}) {
  host = document.createElement("div");
  box.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Affix, { target: box, ...props }, "pinned")));
  // The rects of the placeholder / content are controlled by the test
  const place = host.querySelector<HTMLElement>('[data-slot="affix"]')!;
  const content = host.querySelector<HTMLElement>('[data-slot="affix-content"]')!;
  place.getBoundingClientRect = () => new DOMRect(30, naturalTop, 120, HEIGHT);
  // Once pinned the content is fixed: drawn at --affix-top / --affix-left (plus shift, simulating an ancestor with transform)
  content.getBoundingClientRect = () => {
    if (!content.hasAttribute("data-affixed")) return new DOMRect(30, naturalTop, 120, HEIGHT);
    const top = Number.parseFloat(place.style.getPropertyValue("--affix-top"));
    const left = Number.parseFloat(place.style.getPropertyValue("--affix-left"));
    return new DOMRect(left + shift.x, top + shift.y, 120, HEIGHT);
  };
  return { place, content };
}
const scrollTo = async (top: number) => {
  naturalTop = top;
  await act(async () => {
    box.dispatchEvent(new Event("scroll"));
  });
  await act(() => new Promise<void>((r) => setTimeout(r, 40)));
};

describe("Affix", () => {
  test("SSR: placeholder plus content, not pinned by default, no class / style", () => {
    const html = renderToStaticMarkup(createElement(Affix, null, "x"));
    expect(html).toContain('data-slot="affix"');
    expect(html).toContain('data-slot="affix-content"');
    expect(html).not.toContain("data-affixed");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("offsetTop: pins once its top passes the container top plus offset, position variables on the root; releases when back", async () => {
    const changes: boolean[] = [];
    const { place, content } = mount({ offsetTop: 20, onChange: (a: boolean) => changes.push(a) });
    await scrollTo(300); // jsdom rects are all 0 on mount, go back to the real initial position before recording
    changes.length = 0;
    await scrollTo(150); // container top 100 + 20 = 120 < 150: not yet
    expect(place.hasAttribute("data-affixed")).toBe(false);
    await scrollTo(110); // 110 < 120: pinned
    expect(place.hasAttribute("data-affixed")).toBe(true);
    expect(content.hasAttribute("data-affixed")).toBe(true);
    expect(place.style.getPropertyValue("--affix-top")).toBe("120");
    expect(place.style.getPropertyValue("--affix-left")).toBe("30");
    expect(place.style.getPropertyValue("--affix-w")).toBe("120");
    expect(place.style.getPropertyValue("--affix-h")).toBe(String(HEIGHT));
    await scrollTo(200);
    expect(place.hasAttribute("data-affixed")).toBe(false);
    expect(changes).toEqual([true, false]); // calls back only on change
  });

  test("neither offsetTop nor offsetBottom: top with offset 0", async () => {
    const { place } = mount();
    await scrollTo(99);
    expect(place.hasAttribute("data-affixed")).toBe(true);
    expect(place.style.getPropertyValue("--affix-top")).toBe("100");
  });

  test("offsetBottom: pins once its bottom is below the container bottom minus offset, pinned to the bottom edge", async () => {
    const { place } = mount({ offsetBottom: 10 });
    await scrollTo(100); // bottom 140, container bottom 300 - 10: not yet
    expect(place.hasAttribute("data-affixed")).toBe(false);
    await scrollTo(400); // bottom 440 > 290: pinned
    expect(place.hasAttribute("data-affixed")).toBe(true);
    expect(place.style.getPropertyValue("--affix-top")).toBe(String(300 - 10 - HEIGHT));
  });

  test("when an ancestor's transform shifts fixed, the measured offset is compensated", async () => {
    const { place, content } = mount({ offsetTop: 0 });
    // Simulate fixed being relative to some ancestor: the actual drawn position exceeds the set top by (13, 7)
    shift.x = 13;
    shift.y = 7;
    void content;
    await scrollTo(50);
    await scrollTo(40); // measure again once pinned
    expect(place.style.getPropertyValue("--affix-top")).toBe(String(100 - 7));
    expect(place.style.getPropertyValue("--affix-left")).toBe(String(30 - 13));
  });

  test("target can be a function or a ref", async () => {
    for (const target of [() => box, { current: box }]) {
      const { place } = mount({ target });
      await scrollTo(50);
      expect(place.hasAttribute("data-affixed")).toBe(true);
      act(() => root?.unmount());
      host?.remove();
    }
  });
});
